import datetime
import json
from collections.abc import Callable

from openai import AsyncOpenAI

import configure
from api import prompt
from database.sql_model import Prompt, LLMModel
from llm import llm_openai


def messages_dump(messages, response_text):
    # TODO: Remove or Improve this debug process
    datestr = datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
    with open(configure.get_store_path(f'message.log'), 'a', encoding='utf-8') as f:
        f.write(f'================== {datestr} ==================\n')
        for message in messages:
            f.write(message['role'] + ': ' + message['content'] + '\n')
        f.write('result: ' + response_text + '\n')


async def perform_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list):
    if prompt_value.llm == LLMModel.OPENAI:
        return await llm_openai.perform_prompt(prompt_value, extra_data, insert_message)

    raise NotImplementedError(f"{prompt_value.llm} is not implemented.")


async def stream_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list,
                        complete_receiver: Callable[[str], None]):
    # TODO: 완성된 문자열을 전달하는 더 이쁜 방법(complete_receiver) 없을까?

    if prompt_value.llm == LLMModel.OPENAI:
        yield llm_openai.stream_prompt(prompt_value, extra_data, insert_message, complete_receiver)
        return

    raise NotImplementedError(f"{prompt_value.llm} is not implemented.")