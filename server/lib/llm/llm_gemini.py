import asyncio
from typing import Optional, Callable

from google import genai
from google.genai import types
# noinspection PyProtectedMember
from google.genai.types import SafetySetting, HarmBlockThreshold, HarmCategory
from sqlmodel import Session

import lib.prompt
import settings
from api.common import RequestWrapper
from database.sql_model import Prompt
from lib.cbs import CBSHelper
from lib.llm.config_helper import JsonConfigHelper
from lib.web import generate_event_stream_message

safety_settings = [
    SafetySetting(threshold=HarmBlockThreshold.BLOCK_NONE, category=HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY),
    SafetySetting(threshold=HarmBlockThreshold.BLOCK_NONE, category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT),
    SafetySetting(threshold=HarmBlockThreshold.BLOCK_NONE, category=HarmCategory.HARM_CATEGORY_HARASSMENT),
    SafetySetting(threshold=HarmBlockThreshold.BLOCK_NONE, category=HarmCategory.HARM_CATEGORY_HATE_SPEECH),
    SafetySetting(threshold=HarmBlockThreshold.BLOCK_NONE, category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT),
]


class GeminiConfig(JsonConfigHelper):
    def __init__(self, config: Optional[str] = None):
        super().__init__(config)
        self.key = self.get_string_data('key', None)
        self.model = self.get_string_data('model', 'gemini-1.5-pro')
        self.max_input = self.get_integer_data('max_input', None)
        self.max_output = self.get_integer_data('max_output', None)

        self.presence_penalty = self.get_float_data('presence_penalty', None)
        self.frequency_penalty = self.get_float_data('frequency_penalty', None)
        self.temperature = self.get_float_data('temperature', None)
        self.top_p = self.get_float_data('top_p', None)
        self.top_k = self.get_float_data('top_k', None)


def get_key(config: GeminiConfig, session: Session) -> str:
    if config.key:
        return config.key

    global_key = settings.get_gemini_api_key(session)
    if global_key:
        return global_key

    raise NotImplementedError("Gemini API Key is not set.")


def convert_to_gemini(messages: list) -> (list, str):
    converted_messages = []
    system = ''
    for message in messages:
        role = message['role']
        if role == 'assistant':
            role = 'model'
        if role == 'system':
            system += message['content'] + '\n'
            continue
        converted_messages.append({
            'role': role,
            'parts': [message['content']],
        })

    reload = []

    for message in converted_messages:
        reload.append(types.Content(role=message['role'], parts=[types.Part(text=message['parts'][0])]))

    if system.strip() == "":
        return reload, None

    return reload, system.rstrip()


def process_content(content, in_cot: bool) -> [str, bool]:
    if len(content.parts) == 2:
        result = "<COT>"
        result += content.parts[0].text or ""
        result += "</COT>"
        result += content.parts[1].text or ""
        return result, False
    elif in_cot and isinstance(content.parts[0].thought, bool) and not content.parts[0].thought:
        result = "</COT>"
        result += content.parts[0].text or ""
        return result, False
    elif not in_cot and isinstance(content.parts[0].thought, bool) and content.parts[0].thought:
        result = "<COT>"
        result += content.parts[0].text or ""
        return result, True

    return content.parts[0].text or "", in_cot


def generate_client(prompt_value: Prompt, cbs: CBSHelper, wrapper: RequestWrapper):
    session = wrapper.session
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs, wrapper)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)
    contents, system = convert_to_gemini(messages)
    config = GeminiConfig(prompt_value.llm_config)

    client = genai.Client(api_key=get_key(config, session), http_options={'api_version': 'v1alpha'})  # type: ignore

    thinking_config = types.ThinkingConfig(include_thoughts=True)
    if 'thinking' not in config.model:
        thinking_config = None

    generate_config = types.GenerateContentConfig(
        system_instruction=system,
        safety_settings=safety_settings,
        thinking_config=thinking_config,
    )

    if config.max_input:
        contents_tokens = client.models.count_tokens(model=config.model, contents=contents)
        system_tokens = client.models.count_tokens(model=config.model, contents=system)
        num_tokens = contents_tokens.total_tokens + system_tokens.total_tokens
        if num_tokens > config.max_input:
            raise ValueError(f"Input too long. (max_input={config.max_input}, num_tokens={num_tokens})")

    return parsed_prompt, messages, contents, client, generate_config, config


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, wrapper: RequestWrapper):
    parsed_prompt, messages, contents, client, generate_config, config = generate_client(prompt_value, cbs, wrapper)

    response = await client.aio.models.generate_content(model=config.model, contents=contents,
                                                        config=generate_config)

    if response.candidates is None:
        raise Exception(response.prompt_feedback.block_reason)

    from lib.llm.llm_common import messages_dump
    result, _ = process_content(response.candidates[0].content, True)

    messages_dump(messages, result)

    return result


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, wrapper: RequestWrapper,
                        complete_receiver: Callable[[str], None] | None, response_as_message: bool = True):
    parsed_prompt, messages, contents, client, generate_config, config = generate_client(prompt_value, cbs, wrapper)
    collected_messages = []

    in_cot = False

    async for chunk in client.aio.models.generate_content_stream(model=config.model, contents=contents,
                                                                 config=generate_config):
        if chunk.candidates is None:
            raise Exception(chunk.prompt_feedback.block_reason)
        chunk_message = ''
        for candidate in chunk.candidates:
            chunk_message, in_cot = process_content(candidate.content, in_cot)

        collected_messages.append(chunk_message)

        if response_as_message:
            yield generate_event_stream_message(
                'stream',
                chunk_message)
        else:
            yield chunk_message

        await asyncio.sleep(0.01)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, ''.join(collected_messages))

    if complete_receiver:
        complete_receiver(''.join(collected_messages))
