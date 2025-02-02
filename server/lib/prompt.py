from collections.abc import Callable
from enum import Enum
from typing import Optional, Tuple

from api.common import RequestWrapper
from database.sql_model import Prompt
from lib.cbs import CBSHelper


class BlockType(Enum):
    IF_BLOCK = 0
    IF_TRUE = 1
    IF_FALSE = 2


def parse_cbs(text: str, check: Callable[[str], Tuple[str, bool]]):
    mismatch = []
    building_text = []

    # 해야 하는것: 텍스트를 타고 들어가며 {{를 만나면 }}를 만날때까지 공간을 묶고, 그 공간을 체크하기
    # }} 를 만나러 가는 중에 {{ 를 추가적으로 만나면 중첩으로 인식하고, 이를 올바르게 처리하기

    # 분석중인 태그, 중첩될 수 있으므로 list 자료형으로 구현
    building_tag: list[list] = []

    # 등록된 블럭 정보
    registered_block: list[BlockType] = []

    def check_if_false():
        return len(registered_block) != 0 and registered_block[-1] == BlockType.IF_FALSE

    def pop_last_block(check_type: BlockType):
        for i in range(len(registered_block) - 1, -1, -1):
            target_type = registered_block[i]
            if check_type == BlockType.IF_BLOCK:
                if target_type == BlockType.IF_TRUE or target_type == BlockType.IF_FALSE:
                    del registered_block[i]
                    return True
            elif target_type == check_type:
                del registered_block[i]
                return True

        return False

    # 전에 시작 태그 '{' 를 만났는지의 여부
    previous_encounter_start = False

    # 전에 종료 태그 '}' 를 만났는지의 여부
    previous_encounter_end = False

    def process_leftover(leftover: str):
        # 마지막에 등록된 if 블럭이 실패한경우, 문자열 등록을 방지
        if check_if_false():
            return

        if len(building_tag) > 0:
            building_tag[-1].append(leftover)
        else:
            building_text.append(leftover)

    for c in text:
        ### CHECK FOR START
        if c == '{':
            if previous_encounter_start:
                # 전에 {를 만난 상태에서 다시 { 를 만난 경우이니 태그 분석 시작
                building_tag.append([])
                previous_encounter_start = False
            else:
                previous_encounter_start = True
            # { 를 만난경우 일단 보류 시킴
            continue

        if previous_encounter_start:
            # 이전에 만난 { 가 완전히 열리지 않았으므로 설레발을 멈추고 보류했던 { 를 등록함
            previous_encounter_start = False
            process_leftover('{')

        ### CHECK FOR END
        if c == '}' and len(building_tag) > 0:
            if previous_encounter_end:
                previous_encounter_end = False
                # 태그가 닫혔다면, 마지막 태그를 열어 check 함수를 통해 처리
                tag = ''.join(building_tag.pop())

                if tag.startswith("/if"):
                    pop_last_block(BlockType.IF_BLOCK)
                    continue

                # if-false 상태에서 블럭을 닫는게 아니였는데 /if 태그도 아니였다면
                # 어차피 등록되지 않을 내용이니 내부를 추가 분석할 필요가 없음
                if check_if_false():
                    continue

                if tag.startswith("#if "):
                    condition = tag[4:]
                    parsed_condition, inner_mismatch = parse_cbs(condition, check)
                    if inner_mismatch:
                        mismatch.extend(inner_mismatch)
                    if parsed_condition == '1':
                        registered_block.append(BlockType.IF_TRUE)
                    else:
                        registered_block.append(BlockType.IF_FALSE)
                    continue

                parsed_tag, is_matched = check(tag)

                # 매칭된게 없다면 목록에 등록하고, 예상되는 원문 "{{parsed_tag}}" 로 되돌림
                if not is_matched:
                    mismatch.append(parsed_tag)
                    parsed_tag = "{{" + parsed_tag + "}}"
                else:
                    # 매칭된게 있는경우, 변경된 내용이 또 다른 태그를 가지고 있는지 판단함
                    parsed_tag, inner_mismatch = parse_cbs(parsed_tag, check)
                    mismatch.extend(inner_mismatch)

                # 빌드중인 태그가 없다면 결과물에, 아니라면 가장 마지막 위치에 있는 tag에 빌드된 문장을 전송
                if len(building_tag) == 0:
                    building_text.append(parsed_tag)
                else:
                    building_tag[-1].append(parsed_tag)
            else:
                previous_encounter_end = True
            continue

        if previous_encounter_end:
            # 위와 동일하게 설레발을 친게 있다면 복구
            previous_encounter_end = False
            process_leftover('}')

        process_leftover(c)

    while len(building_tag) > 0:
        # 닫히지 않은 태그는 올바른 CBS 태그가 아니므로 원문을 보내기
        building_text.append("{{" + ''.join(building_tag.pop(0)))

    return ''.join(building_text), mismatch


def parse_prompt(prompt: str, cbs: CBSHelper, wrapper: Optional[RequestWrapper] = None) -> tuple[str, list]:
    lines = [line.strip() for line in prompt.split('\n')]
    filtered_lines = [line for line in lines if not line.startswith('//YUME')]
    parsed = '\n'.join(filtered_lines)

    parsed, mismatch = parse_cbs(parsed, cbs.check)

    # Small fallback for <user> and <char>
    parsed = parsed.replace("<user>", cbs.user).replace("<char>", cbs.char)

    def client_filter(value: str):
        if value.startswith("img"):
            return False
        return True

    mismatch = list(filter(client_filter, mismatch))

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
