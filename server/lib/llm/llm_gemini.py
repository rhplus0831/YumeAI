import asyncio
import json
from dataclasses import asdict, dataclass
from typing import Optional, Callable

from google import genai
from google.genai import types
from sqlmodel import Session

import configure
import lib.prompt
import settings
from database.sql_model import Prompt
from lib.cbs import CBSHelper
from lib.web import generate_event_stream_message


@dataclass
class GeminiConfig:
    model: str = 'gemini-1.5-pro'
    key: str = ''

    @staticmethod
    def from_json(config: Optional[str] = None) -> 'GeminiConfig':
        if not config:
            return GeminiConfig()  # 기본값으로 초기화
        data = json.loads(config)

        # noinspection PyTypeChecker
        defaults = asdict(GeminiConfig())  # dataclass 기본값을 dict로 추출
        defaults.update(data)  # JSON 데이터로 기본값 덮어쓰기
        return GeminiConfig(**defaults)

    def to_json(self) -> str:
        return json.dumps(self.__dict__)


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


def process_content(content) -> [str, bool]:
    # Reference: https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/request.ts
    # But... why?
    if len(content.parts) == 2:
        result = content.parts[0].text or ""
        result += "</COT>"
        result += content.parts[1].text or ""
    elif isinstance(content.parts[0].thought, bool) and not content.parts[0].thought:
        result = "</COT>"
        result += content.parts[0].text or ""
    else:
        result = content.parts[0].text or ""

    return result


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session):
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)
    contents, system = convert_to_gemini(messages)
    config = GeminiConfig.from_json(prompt_value.llm_config)

    client = genai.Client(api_key=get_key(config, session))

    response = await client.aio.models.generate_content(model=config.model, contents=contents,
                                                        config=types.GenerateContentConfig(
                                                            system_instruction=system
                                                        ))

    from lib.llm.llm_common import messages_dump
    result = process_content(response.candidates[0].content)

    if 'thinking' in config.model:
        result = '<COT>' + result

    messages_dump(messages, result)

    return result


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session,
                        complete_receiver: Callable[[str], None]):
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)
    contents, system = convert_to_gemini(messages)
    config = GeminiConfig.from_json(prompt_value.llm_config)

    client = genai.Client(api_key=get_key(config, session))
    collected_messages = []

    # TODO: Better COT Model Check
    if 'thinking' in config.model:
        collected_messages.append('<COT>')
        yield generate_event_stream_message('stream', '<COT>')

    async for chunk in client.aio.models.generate_content_stream(model=config.model, contents=contents,
                                                                 config=types.GenerateContentConfig(
                                                                     system_instruction=system
                                                                 )):
        chunk_message = ''
        for candidate in chunk.candidates:
            chunk_message = process_content(candidate.content)

        collected_messages.append(chunk_message)
        yield generate_event_stream_message(
            'stream',
            chunk_message)
        await asyncio.sleep(0.01)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, ''.join(collected_messages))

    complete_receiver(''.join(collected_messages))
