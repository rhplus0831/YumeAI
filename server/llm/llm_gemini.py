import json
import os
from dataclasses import asdict, dataclass
from typing import Optional, Callable

import configure
from api import prompt
from database.sql_model import Prompt

default_key_path = configure.get_store_path('gemini_key')
default_key = ''
if os.path.exists(default_key_path):
    with open(default_key_path, 'r', encoding='utf-8') as f:
        default_key = f.read().strip()


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


def get_key(config: GeminiConfig) -> str:
    if config.key:
        return config.key
    return default_key


def convert_to_gemini(messages: list) -> (list, str):
    converted_messages = []
    system = ''
    # TODO: Better System Conversation?
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
    return converted_messages, system.rstrip()


async def perform_prompt(prompt_value: Prompt, extra_data: dict):
    import google.generativeai as genai
    parsed_prompt, _ = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.generate_openai_messages(parsed_prompt)
    messages, system = convert_to_gemini(messages)
    config = GeminiConfig.from_json(prompt_value.llm_config)

    genai.configure(api_key=get_key(config))
    if not system:
        model = genai.GenerativeModel(config.model)
    else:
        model = genai.GenerativeModel(config.model, system_instruction=system)

    response = await model.generate_content_async(messages)

    from llm.llm_common import messages_dump
    messages_dump(messages, response.text)

    return response.text


async def stream_prompt(prompt_value: Prompt, extra_data: dict, complete_receiver: Callable[[str], None]):
    import google.generativeai as genai
    parsed_prompt, _ = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.generate_openai_messages(parsed_prompt)
    messages, system = convert_to_gemini(messages)
    config = GeminiConfig.from_json(prompt_value.llm_config)

    genai.configure(api_key=get_key(config))
    if not system:
        model = genai.GenerativeModel(config.model)
    else:
        model = genai.GenerativeModel(config.model, system_instruction=system)

    response = await model.generate_content_async(messages, stream=True)

    collected_messages = []
    async for chunk in response:
        chunk_message = chunk.text or ""
        collected_messages.append(chunk_message)
        yield json.dumps({
            "status": 'stream',
            "message": chunk_message
        }) + "\n"

    from llm.llm_common import messages_dump
    messages_dump(messages, ''.join(collected_messages))

    complete_receiver(''.join(collected_messages))
