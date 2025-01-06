import re
from typing import Callable

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session
from starlette.responses import JSONResponse

from api import common
from database.sql_model import PromptBase, Prompt

router = APIRouter(prefix="/prompt", tags=["prompt"])
engine: Engine


class PromptUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None
    type: str | None = None

    llm: str | None = None
    llm_config: str | None = None

    filters: str | None = None


common.validate_update_model(PromptBase, PromptUpdate)


def parse_tag(prompt: str, extra_map: dict[str, Callable[[], str]], start: str, end: str) -> tuple[str, list]:
    reader = prompt
    result_ex = []

    mismatch_list = []

    while start in reader:
        if end not in reader:
            result_ex.append(reader)
            reader = ''
            break

        sinx = reader.find(start)
        einx = reader.find(end)

        header = reader[0:sinx]
        body = reader[sinx:einx + len(end)]
        footer = reader[einx + len(end):]

        if header.strip() != "":
            result_ex.append(header)

        pattern = rf"{start}(.*?){end}"
        match = re.search(pattern, body)

        if match:
            if match.group(1) in extra_map:
                result_ex.append(extra_map[match.group(1)]())
            else:
                mismatch_list.append(body)
                result_ex.append(body)
        else:
            result_ex.append(body)

        reader = footer

    if reader.strip() != '':
        result_ex.append(reader)

    return ''.join(result_ex), mismatch_list


def parse_prompt(prompt: str, extra_map: dict[str, Callable[[], str]]) -> tuple[str, list]:
    mismatch = []
    parsed, first_mismatch = parse_tag(prompt, extra_map, "<", ">")
    parsed, second_mismatch = parse_tag(parsed, extra_map, "{{", "}}")
    mismatch.extend(first_mismatch)
    mismatch.extend(second_mismatch)
    return parsed, mismatch


def generate_openai_messages(prompt: str) -> list:
    jsoned_prompt = [{'role': 'system', 'content': ''}]

    def remove_last_newline():
        if len(jsoned_prompt[-1]['content']) != 0:
            if jsoned_prompt[-1]['content'][-1] == '\n':
                jsoned_prompt[-1]['content'] = jsoned_prompt[-1]['content'][:-1]

    def check_and_insert(role: str):
        if jsoned_prompt[-1]['role'] != role:
            remove_last_newline()
            jsoned_prompt.append({"role": role, "content": ''})

    split = prompt.split("\n")
    for line in split:
        if line.strip() == "||system||":
            check_and_insert('system')
            continue
        elif line.strip() == "||user||":
            check_and_insert('user')
            continue
        elif line.strip() == "||assistant||":
            check_and_insert('assistant')
            continue

        jsoned_prompt[-1]['content'] += line + "\n"

    remove_last_newline()
    return jsoned_prompt


def check_use_one_time(parsed: str, name: str, result: list):
    if parsed.count(f'__parsed_{name}__') == 0:
        result.append(f'{name} 태그가 한번도 사용되지 않았습니다.')
    elif parsed.count(f'__parsed_{name}__') != 1:
        result.append(f'{name} 태그가 한번 이상 사용되었습니다.')


def check_use(parsed: str, name: str, result: list):
    if parsed.count(f'__parsed_{name}__') == 0:
        result.append(f'{name} 태그가 한번도 사용되지 않았습니다.')


def lint_generic(prompt: Prompt):
    result = []

    msg = generate_openai_messages(prompt.prompt)

    system_count = 0
    for data in msg:
        if data['role'] == 'system':
            system_count += 1

    if prompt.llm != 'openai' and (system_count > 1 or msg[0]['role'] != 'system'):
        result.append("시스템 프롬을 따로 지정하는 모델에 시스템 역할이 두개 이상이거나 다른 역할이 먼저 있습니다. 시스템 역할은 제공된 순서나 갯수와는 상관없이 하나로 합쳐서 전달됩니다.")

    return result


def lint_chat(prompt: Prompt):
    result = lint_generic(prompt)

    parsed, mismatch_list = parse_prompt(prompt.prompt, {
        'user': lambda: '__parsed_user__',
        'user_prompt': lambda: '__parsed_user_prompt__',
        'char': lambda: '__parsed_char__',
        'char_prompt': lambda: '__parsed_char_prompt__',
        'summaries': lambda: '__parsed_summaries__',
        're_summaries': lambda: '__parsed_re_summaries__',
        'chat': lambda: '__parsed_chat__',
        'conversations': lambda: '__parsed_conversations__',
        'message': lambda: '__parsed_message__',
    })

    check_use(parsed, 'user', result)
    check_use_one_time(parsed, 'user_prompt', result)
    check_use(parsed, 'char', result)
    check_use_one_time(parsed, 'char_prompt', result)

    check_use_one_time(parsed, 'summaries', result)
    check_use_one_time(parsed, 're_summaries', result)

    using_conversations = parsed.count('__parsed_conversations__')
    using_message = parsed.count('__parsed_message__')

    using_chat = parsed.count('__parsed_chat__')
    if using_chat:
        check_use(parsed, 'chat', result)

        if using_conversations:
            result.append("chat 태그가 있는 상태에서 conversations 태그를 사용하고 있습니다.")
        if using_message:
            result.append("chat 태그가 있는 상태에서 message 태그를 사용하고 있습니다.")
    else:
        check_use_one_time(parsed, 'conversations', result)
        check_use_one_time(parsed, 'message', result)

    for mismatch in mismatch_list:
        result.append(f'{mismatch}는 알려지지 않은 태그입니다.')

    return result


def lint_summary(prompt: Prompt):
    result = lint_generic(prompt)

    parsed, mismatch_list = parse_prompt(prompt.prompt, {
        'content': lambda: '__parsed_content__',
        'user': lambda: '__parsed_user__',
        'user_message': lambda: '__parsed_user_message__',
        'char': lambda: '__parsed_char__',
        'char_message': lambda: '__parsed_char_message__',
    })

    using_user_message = parsed.count('__parsed_user_message__')
    using_char_message = parsed.count('__parsed_char_message__')

    using_content = parsed.count('__parsed_content__')
    if using_content:
        check_use(parsed, 'content', result)

        if using_user_message:
            result.append("content 태그가 있는 상태에서 user_message 태그를 사용하고 있습니다.")

        if using_char_message:
            result.append("content 태그가 있는 상태에서 char_message 태그를 사용하고 있습니다.")
    else:
        check_use_one_time(parsed, 'user_message', result)
        check_use_one_time(parsed, 'char_message', result)

    for mismatch in mismatch_list:
        result.append(f'{mismatch}는 알려지지 않은 태그입니다.')

    return result


def lint_content_only(prompt: Prompt):
    result = lint_generic(prompt)

    parsed, mismatch_list = parse_prompt(prompt.prompt, {
        'content': lambda: '__parsed_content__',
    })

    check_use_one_time(parsed, 'content', result)

    for mismatch in mismatch_list:
        result.append(f'{mismatch}는 알려지지 않은 태그입니다.')

    return result


def register():
    @router.post("/{id}/lint", response_model=PromptUpdate)
    def lint(id: int):
        with Session(engine) as session:
            prompt = common.get_or_404(Prompt, session, id)

        result = []

        if prompt.type == 'chat':
            result = lint_chat(prompt)
        elif prompt.type == 'summary':
            result = lint_summary(prompt)
        elif prompt.type == 're-summary' or prompt.type == 'translate':
            result = lint_content_only(prompt)

        if len(result) == 0:
            return JSONResponse(content={
                'check': 'ok',
                'message': '확인된 문제가 없습니다.',
            }, status_code=200)

        return JSONResponse(content={
            'check': 'fail',
            'message': result
        }, status_code=200)
