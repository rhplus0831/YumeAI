# 나중에 기능 개선을 편하게 하기 위한 유틸 클래스
import datetime
import json
import os

from openai import AsyncOpenAI

import configure
from api import prompt
from database.sql_model import Prompt


def messages_dump(messages):
    # TODO: Remove this debug process
    datestr = datetime.datetime.today().strftime('%Y%m%d_%H%M%S')
    with open(configure.get_store_path(f'message_check/{datestr}.json'), 'w', encoding='utf-8') as f:
        f.write(json.dumps(messages, indent=4, ensure_ascii=False))


async def run_prompt(prompt_value: Prompt, extra_data: dict, insert_message: list):
    key_path = configure.get_store_path('openai_key')
    if not os.path.exists(key_path):
        raise Exception("테스트키 없음")

    with open(key_path, 'r', encoding='utf-8') as f:
        key = f.read().strip()

    oai = AsyncOpenAI(api_key=key)
    parsed_prompt = prompt.parse_prompt(prompt_value.prompt, extra_data)
    messages = prompt.json_prompt(parsed_prompt)
    for insert in insert_message:
        messages.append(insert)

    messages_dump(messages)

    response = await oai.chat.completions.create(model='gpt-4o-mini', messages=messages, temperature=0.35,
                                      max_tokens=2048,
                                      top_p=1,
                                      frequency_penalty=0,
                                      presence_penalty=0)

    return response.choices[0].message.content