import re
from collections.abc import Callable
from typing import Optional

from api.common import RequestWrapper
from database.sql_model import Prompt
from lib.cbs import CBSHelper, yume_cutter_check


def parse_tag(text: str, check: Callable[[str], [[str, bool]]], start_word: str, end_word: str):
    mismatch = []

    def process_content(text):
        def find_innermost(text):
            """가장 안쪽의 블록을 찾습니다."""
            open_indices = [m.start() for m in re.finditer(re.escape(start_word), text)]
            close_indices = [m.start() for m in re.finditer(re.escape(end_word), text)]

            if not open_indices or not close_indices:
                return None, None

            # 가장 마지막에 열린 '{'를 찾고, 그 이후에 가장 먼저 닫히는 '}'를 찾습니다.
            for open_idx in reversed(open_indices):
                for close_idx in close_indices:
                    if close_idx > open_idx:
                        return open_idx, close_idx
            return None, None

        start, end = find_innermost(text)
        if start is not None and end is not None:
            head = text[:start]
            foot = text[end + len(end_word):]
            content = text[start + len(start_word):end]
            processed_content, found = check(content)
            if not found:

                mismatch.append(content)
                processed_content = f"[[YUMEMismatch {processed_content}]]"

            elif processed_content.strip() == '':
                if head.endswith("\n"):
                    head = head[:-1]
                # if foot.startswith("\n"):
                #     foot = foot[1:]

            new_text = head + processed_content + foot
            return process_content(new_text)  # 재귀 호출
        else:
            return text

    return process_content(text), mismatch


def parse_prompt(prompt: str, cbs: CBSHelper, wrapper: Optional[RequestWrapper] = None) -> tuple[str, list]:
    lines = [line.strip() for line in prompt.split('\n')]
    filtered_lines = [line for line in lines if not line.startswith('//YUME')]
    parsed = '\n'.join(filtered_lines)

    parsed, mismatch = parse_tag(parsed, cbs.check, "{{", "}}")

    def client_filter(value: str):
        if value.startswith("img"):
            return False
        return True

    mismatch = list(filter(client_filter, mismatch))

    parsed, _ = parse_tag(parsed, yume_cutter_check, '[[', ']]')

    if wrapper:
        wrapper.log(f'CBS 처리전', True)
        wrapper.log(prompt, False)
        wrapper.log(f'CBS 처리후', True)
        wrapper.log(parsed, False)
        if len(mismatch) > 0:
            wrapper.log('매칭되지 않은 항목', True)
            wrapper.log(','.join(mismatch), False)

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

    cbs = CBSHelper()
    cbs.user = '__parsed_user__'
    cbs.user_prompt = '__parsed_user_prompt__'
    cbs.char = '__parsed_char__'
    cbs.char_prompt = '__parsed_char_prompt__'
    cbs.summaries = '__parsed_summaries__'
    cbs.re_summaries = '__parsed_re_summaries__'
    cbs.chat = '__parsed_chat__'
    cbs.conversations = '__parsed_conversations__'
    cbs.message = '__parsed_message__'

    parsed, mismatch_list = parse_prompt(prompt.prompt, cbs)

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

    cbs = CBSHelper()
    cbs.content = '__parsed_content__'
    cbs.user = '__parsed_user__'
    cbs.user_message = '__parsed_user_message__'
    cbs.char = '__parsed_char__'
    cbs.char_message = '__parsed_char_message__'

    parsed, mismatch_list = parse_prompt(prompt.prompt, cbs)

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

    cbs = CBSHelper()
    cbs.content = '__parsed_content__'

    parsed, mismatch_list = parse_prompt(prompt.prompt, cbs)

    check_use_one_time(parsed, 'content', result)

    for mismatch in mismatch_list:
        result.append(f'{mismatch}는 알려지지 않은 태그입니다.')

    return result
