import json
import os
from dataclasses import dataclass, asdict
from typing import Optional, Callable

from openai import AsyncOpenAI

import configure
from api import prompt
from database.sql_model import Prompt
from llm.llm_common import messages_dump

# Add prefix for prevent conflict with library

default_key_path = configure.get_store_path('openai_key')
default_key = ''
if os.path.exists(default_key_path):
    with open(default_key_path, 'r', encoding='utf-8') as f:
        default_key = f.read().strip()


@dataclass
class OpenAIConfig:
    endpoint: str = ''
    model: str = 'gpt-4o'
    key: str = ''

    @staticmethod
    def from_json(config: Optional[str] = None) -> 'OpenAIConfig':
        if config is None:
            return OpenAIConfig()  # 기본값으로 초기화
        data = json.loads(config)

        # noinspection PyTypeChecker
        defaults = asdict(OpenAIConfig())  # dataclass 기본값을 dict로 추출
        defaults.update(data)  # JSON 데이터로 기본값 덮어쓰기
        return OpenAIConfig(**defaults)

    def to_json(self) -> str:
        return json.dumps(self.__dict__)


def get_key(config: OpenAIConfig) -> str:
    if config.key:
        return config.key
    return default_key


async def perform_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list):
    parsed_prompt = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.json_prompt(parsed_prompt)
    for insert in insert_message:
        messages.append(insert)

    config = OpenAIConfig(prompt_value.llm_config)
    oai = AsyncOpenAI(api_key=get_key(config))

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=0.35,
                                                 max_tokens=2048,
                                                 top_p=1,
                                                 frequency_penalty=0,
                                                 presence_penalty=0)

    messages_dump(messages, response.choices[0].message.content)

    return response.choices[0].message.content


async def stream_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list,
                        complete_receiver: Callable[[str], None]):
    parsed_prompt = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.json_prompt(parsed_prompt)
    for insert in insert_message:
        messages.append(insert)

    config = OpenAIConfig(prompt_value.llm_config)
    oai = AsyncOpenAI(api_key=get_key(config))

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=0.8,
                                                 max_tokens=2048,
                                                 top_p=1,
                                                 frequency_penalty=0,
                                                 presence_penalty=0, stream=True)
    collected_messages = []
    async for chunk in response:
        chunk_message = chunk.choices[0].delta.content or ""
        collected_messages.append(chunk_message)
        yield json.dumps({
            "status": 'stream',
            "message": chunk_message
        }) + "\n"

    messages_dump(messages, ''.join(collected_messages))

    complete_receiver(''.join(collected_messages))
