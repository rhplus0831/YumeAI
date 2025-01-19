import asyncio
from typing import Optional, Callable

import tiktoken
from openai import AsyncOpenAI
from sqlmodel import Session

import lib.prompt
from database.sql_model import Prompt
from lib.cbs import CBSHelper
from lib.llm.config_helper import JsonConfigHelper
from lib.web import generate_event_stream_message
from settings import get_openai_api_key


class OpenAIConfig(JsonConfigHelper):
    def __init__(self, config: Optional[str] = None):
        super().__init__(config)
        self.key = self.get_string_data('key', None)
        self.endpoint = self.get_string_data('endpoint', None)
        self.model = self.get_string_data('model', 'gpt-4o')
        self.max_input = self.get_integer_data('max_input', None)
        self.max_output = self.get_integer_data('max_output', None)

        self.presence_penalty = self.get_float_data('presence_penalty', None)
        self.frequency_penalty = self.get_float_data('frequency_penalty', None)
        self.temperature = self.get_float_data('temperature', None)
        self.top_p = self.get_float_data('top_p', None)


def get_key(config: OpenAIConfig, session: Session) -> str:
    if config.key:
        return config.key

    global_key = get_openai_api_key(session)
    if global_key:
        return global_key.value

    if config.endpoint:
        # Custom endpoint may doesn't need to set key?
        return 'yume-ai'
    raise NotImplementedError("OpenAI API Key is not set.")


# Reference: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
def num_tokens_from_messages(messages, model="gpt-4o-mini-2024-07-18"):
    """Return the number of tokens used by a list of messages."""
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        encoding = tiktoken.get_encoding("o200k_base")
    if model in {
        "gpt-3.5-turbo-0125",
        "gpt-4-0314",
        "gpt-4-32k-0314",
        "gpt-4-0613",
        "gpt-4-32k-0613",
        "gpt-4o-mini-2024-07-18",
        "gpt-4o-2024-08-06"
    }:
        tokens_per_message = 3
        tokens_per_name = 1
    elif "gpt-3.5-turbo" in model:
        # print("Warning: gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0125.")
        return num_tokens_from_messages(messages, model="gpt-3.5-turbo-0125")
    elif "gpt-4o-mini" in model:
        # print("Warning: gpt-4o-mini may update over time. Returning num tokens assuming gpt-4o-mini-2024-07-18.")
        return num_tokens_from_messages(messages, model="gpt-4o-mini-2024-07-18")
    elif "gpt-4o" in model:
        # print("Warning: gpt-4o and gpt-4o-mini may update over time. Returning num tokens assuming gpt-4o-2024-08-06.")
        return num_tokens_from_messages(messages, model="gpt-4o-2024-08-06")
    elif "gpt-4" in model:
        # print("Warning: gpt-4 may update over time. Returning num tokens assuming gpt-4-0613.")
        return num_tokens_from_messages(messages, model="gpt-4-0613")
    else:
        # Use fallback...
        tokens_per_message = 3
        tokens_per_name = 1

    num_tokens = 0
    for message in messages:
        num_tokens += tokens_per_message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
            if key == "name":
                num_tokens += tokens_per_name
    num_tokens += 3  # every reply is primed with <|start|>assistant<|message|>
    return num_tokens


def generate_client(prompt_value: Prompt, cbs: CBSHelper, session: Session):
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)

    config = OpenAIConfig(prompt_value.llm_config)
    if config.max_input:
        num_tokens = num_tokens_from_messages(messages, config.model)
        if num_tokens > config.max_input:
            raise ValueError(f"Input too long. (max_input={config.max_input}, num_tokens={num_tokens})")

    base_url = None
    if config.endpoint:
        base_url = config.endpoint
    key = get_key(config, session)

    oai = AsyncOpenAI(api_key=key, base_url=base_url)

    return parsed_prompt, messages, oai, config


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session):
    parsed_prompt, messages, oai, config = generate_client(prompt_value, cbs, session)

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=config.temperature,
                                                 max_tokens=config.max_output,
                                                 top_p=config.top_p,
                                                 frequency_penalty=config.frequency_penalty,
                                                 presence_penalty=config.presence_penalty)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, response.choices[0].message.content)

    return response.choices[0].message.content


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session,
                        complete_receiver: Callable[[str], None] | None, response_as_message: bool = True):
    parsed_prompt, messages, oai, config = generate_client(prompt_value, cbs, session)

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=config.temperature,
                                                 max_tokens=config.max_output,
                                                 top_p=config.top_p,
                                                 frequency_penalty=config.frequency_penalty,
                                                 presence_penalty=config.presence_penalty, stream=True)
    collected_messages = []
    async for chunk in response:
        chunk_message = chunk.choices[0].delta.content or ""
        collected_messages.append(chunk_message)
        if response_as_message:
            yield generate_event_stream_message('stream', chunk_message)
        else:
            yield chunk_message
        await asyncio.sleep(0.01)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, ''.join(collected_messages))

    if complete_receiver:
        complete_receiver(''.join(collected_messages))
