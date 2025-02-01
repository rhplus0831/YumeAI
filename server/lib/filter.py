import json
import re

from database.sql_model import Room


def replace_with_regex(regex, replace, input_text):
    def replacer(match):
        # 매칭된 그룹(여러 개일 수 있음)을 $1, $2... 식으로 대치
        if match.groups():
            result = replace
            for i, group in enumerate(match.groups(), start=1):
                result = result.replace(f"${i}", group)
            return result
        return replace  # 그룹이 없으면 그대로 치환

    return re.sub(regex, replacer, input_text)


def apply_filter(room: Room, filter_type: str, text: str) -> str:
    filters = []
    if room.prompt and room.prompt.filters:
        filters.extend(json.loads(room.prompt.filters))
    if room.bot.filters:
        filters.extend(json.loads(room.bot.filters))

    building = text

    _filter: dict
    for _filter in filters:
        if _filter['type'] != filter_type:
            continue

        regex = _filter['regex']
        replace = _filter['replace']

        building = replace_with_regex(regex, replace, building)

    return building


def remove_cot_string(text: str):
    return replace_with_regex(r'<COT>[\s\S]*<\/COT>', '', text)
