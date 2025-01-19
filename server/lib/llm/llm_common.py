import datetime
import os
from collections.abc import Callable

from sqlmodel import Session

import configure
from database.sql_model import Prompt, LLMModel
from lib.cbs import CBSHelper
from lib.llm import llm_gemini, llm_openai


def messages_dump(messages, response_text):
    if os.getenv('DUMP_LLM_MESSAGES') == 'TRUE':
        # TODO: Remove or Improve this debug process
        datestr = datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
        with open(configure.get_store_path(f'message.log'), 'a', encoding='utf-8') as f:
            f.write(f'================== {datestr} ==================\n')
            for message in messages:
                if 'content' in message:
                    f.write(message['role'] + ': ' + message['content'] + '\n')
                elif 'parts' in message:
                    f.write(message['role'] + ': ' + message['parts'][0] + '\n')

            f.write('result: ' + response_text + '\n')


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session):
    if prompt_value.llm == LLMModel.OPENAI:
        return await llm_openai.perform_prompt(prompt_value, cbs, session)
    if prompt_value.llm == LLMModel.GEMINI:
        return await llm_gemini.perform_prompt(prompt_value, cbs, session)

    raise NotImplementedError(f"{prompt_value.llm} is not implemented.")


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, session: Session,
                        complete_receiver: Callable[[str], None] | None, response_as_message: bool = True):
    # TODO: 완성된 문자열을 전달하는 더 이쁜 방법(complete_receiver) 없을까?

    if prompt_value.llm == LLMModel.OPENAI:
        async for value in llm_openai.stream_prompt(prompt_value, cbs, session, complete_receiver, response_as_message):
            yield value
        return
    if prompt_value.llm == LLMModel.GEMINI:
        async for value in llm_gemini.stream_prompt(prompt_value, cbs, session, complete_receiver, response_as_message):
            yield value
        return

    raise NotImplementedError(f"{prompt_value.llm} is not implemented.")
