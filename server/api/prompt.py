import re
from typing import Callable

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine

router = APIRouter(prefix="/prompt", tags=["prompt"])
engine: Engine


class PromptUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None

    llm: str | None = None
    llm_config: str | None = None

    filters: str | None = None


def parse_tag(prompt: str, extra_map: dict[str, Callable[[], str]], start: str, end: str) -> str:
    reader = prompt
    result_ex = []

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
                result_ex.append(body)
        else:
            result_ex.append(body)

        reader = footer

    if reader.strip() != '':
        result_ex.append(reader)

    return ''.join(result_ex)


def parse_prompt(prompt: str, extra_map: dict[str, Callable[[], str]]) -> str:
    return parse_tag(parse_tag(prompt, extra_map, "<", ">"), extra_map, "{{", "}}")


def json_prompt(prompt: str) -> list:
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
