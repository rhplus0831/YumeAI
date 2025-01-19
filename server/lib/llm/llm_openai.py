import asyncio
import json
import os
from dataclasses import dataclass, asdict
from typing import Optional, Callable

from openai import AsyncOpenAI
from sqlmodel import Session, select

import configure
import lib.prompt
from database.sql_model import Prompt, GlobalSetting, SettingKey
from lib.cbs import CBSHelper
from lib.web import generate_event_stream_message


@dataclass
class OpenAIConfig:
    endpoint: str = ''
    model: str = 'gpt-4o'
    key: str = ''
    temperature: float = 1
    max_tokens: int = 2048
    top_p: float = 1
    frequency_penalty: float = 0
    presence_penalty: float = 0

    @staticmethod
    def from_json(config: Optional[str] = None) -> 'OpenAIConfig':
        if not config:
            return OpenAIConfig()  # 기본값으로 초기화
        data = json.loads(config)

        # noinspection PyTypeChecker
        defaults = asdict(OpenAIConfig())  # dataclass 기본값을 dict로 추출
        defaults.update(data)  # JSON 데이터로 기본값 덮어쓰기
        return OpenAIConfig(**defaults)

    def to_json(self) -> str:
        return json.dumps(self.__dict__)


def get_key(config: OpenAIConfig, session: Session) -> str:
    if config.key:
        return config.key

    global_key = session.exec(select(GlobalSetting).where(GlobalSetting.key == SettingKey.openai_api_key)).one_or_none()
    if global_key:
        return global_key.value

    if config.endpoint:
        # Custom endpoint may doesn't need to set key?
        return 'yume-ai'
    raise NotImplementedError("OpenAI API Key is not set.")


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session):
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)

    config = OpenAIConfig.from_json(prompt_value.llm_config)
    base_url = None
    if config.endpoint:
        base_url = config.endpoint
    key = get_key(config, session)
    oai = AsyncOpenAI(api_key=key, base_url=base_url)

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=config.temperature,
                                                 max_tokens=config.max_tokens,
                                                 top_p=config.top_p,
                                                 frequency_penalty=config.frequency_penalty,
                                                 presence_penalty=config.presence_penalty)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, response.choices[0].message.content)

    return response.choices[0].message.content


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session, complete_receiver: Callable[[str], None]):
    parsed_prompt, _ = lib.prompt.parse_prompt(prompt_value.prompt, cbs)
    messages = lib.prompt.generate_openai_messages(parsed_prompt)

    config = OpenAIConfig.from_json(prompt_value.llm_config)
    base_url = None
    if config.endpoint:
        base_url = config.endpoint
    oai = AsyncOpenAI(api_key=get_key(config, session), base_url=base_url)

    response = await oai.chat.completions.create(model=config.model, messages=messages, temperature=config.temperature,
                                                 max_tokens=config.max_tokens,
                                                 top_p=config.top_p,
                                                 frequency_penalty=config.frequency_penalty,
                                                 presence_penalty=config.presence_penalty, stream=True)
    collected_messages = []
    async for chunk in response:
        chunk_message = chunk.choices[0].delta.content or ""
        collected_messages.append(chunk_message)
        yield generate_event_stream_message('stream', chunk_message)
        await asyncio.sleep(0.01)

    from lib.llm.llm_common import messages_dump
    messages_dump(messages, ''.join(collected_messages))

    complete_receiver(''.join(collected_messages))
