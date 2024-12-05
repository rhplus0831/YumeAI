# 나중에 기능 개선을 편하게 하기 위한 유틸 클래스
import datetime
import json
import os
from collections.abc import Callable

from openai import AsyncOpenAI

import configure
from api import prompt
from database.sql_model import Prompt

key_path = configure.get_store_path('openai_key')
if not os.path.exists(key_path):
    raise Exception("테스트키 없음")

with open(key_path, 'r', encoding='utf-8') as f:
    key = f.read().strip()


def messages_dump(messages, response_text):
    # TODO: Remove or Improve this debug process
    datestr = datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
    with open(configure.get_store_path(f'message.log'), 'a', encoding='utf-8') as f:
        f.write(f'================== {datestr} ==================\n')
        for message in messages:
            f.write(message['role'] + ': ' + message['content'] + '\n')
        f.write('result: ' + response_text + '\n')


async def perform_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list):
    oai = AsyncOpenAI(api_key=key)
    parsed_prompt = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.json_prompt(parsed_prompt)
    for insert in insert_message:
        messages.append(insert)

    response = await oai.chat.completions.create(model='gpt-4o-mini', messages=messages, temperature=0.35,
                                                 max_tokens=2048,
                                                 top_p=1,
                                                 frequency_penalty=0,
                                                 presence_penalty=0)

    messages_dump(messages, response.choices[0].message.content)

    return response.choices[0].message.content


async def stream_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list, complete_receiver: Callable[[str], None]):
    oai = AsyncOpenAI(api_key=key)
    parsed_prompt = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.json_prompt(parsed_prompt)
    for insert in insert_message:
        messages.append(insert)

    response = await oai.chat.completions.create(model='gpt-4o', messages=messages, temperature=0.8,
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

    # TODO: 더 이쁜 방법 없을까?
    complete_receiver(''.join(collected_messages))
