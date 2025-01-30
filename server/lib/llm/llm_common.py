import datetime
import os
from collections.abc import Callable

import configure
from api.common import RequestWrapper
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


async def perform_prompt(prompt_value: Prompt, cbs: CBSHelper, wrapper: RequestWrapper):
    wrapper.log(f'프롬프트 실행: {prompt_value.name}')

    perform_prompt_func = None

    if prompt_value.llm == LLMModel.OPENAI:
        perform_prompt_func = llm_openai.perform_prompt
    if prompt_value.llm == LLMModel.GEMINI:
        perform_prompt_func = llm_gemini.perform_prompt

    if perform_prompt_func:
        result = await perform_prompt_func(prompt_value, cbs, wrapper)
        wrapper.log(f"실행 완료: {result}")
        return result

    raise NotImplementedError(f"{prompt_value.llm} is not implemented.")


async def stream_prompt(prompt_value: Prompt, cbs: CBSHelper, wrapper: RequestWrapper,
                        complete_receiver: Callable[[str], None] | None, response_as_message: bool = True):
    # TODO: 완성된 문자열을 전달하는 더 이쁜 방법(complete_receiver) 없을까?
    wrapper.log(f'프롬프트 스트리밍: {prompt_value.name}')
    stream_prompt_func = None

    if prompt_value.llm == LLMModel.OPENAI:
        stream_prompt_func = llm_openai.stream_prompt
    if prompt_value.llm == LLMModel.GEMINI:
        stream_prompt_func = llm_gemini.stream_prompt

    if stream_prompt_func:
        result = ''

        def inner_complete_receiver(value: str):
            nonlocal result
            result = value
            if complete_receiver:
                complete_receiver(value)

        async for value in stream_prompt_func(prompt_value, cbs, wrapper, inner_complete_receiver, response_as_message):
            yield value

        wrapper.log(f'스트리밍 완료: {result}')
    else:
        raise NotImplementedError(f"{prompt_value.llm} is not implemented.")
