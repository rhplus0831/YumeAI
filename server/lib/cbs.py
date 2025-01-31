# Support layer for risu cbs
# https://kwaroran.github.io/docs/syntax/cbs/
import random

from asteval import Interpreter

from database.sql_model import Room


def yume_cutter_check(text: str) -> [str, bool]:
    if text.startswith("YUMEPass"):
        return text[8:], True
    if text.startswith("YUMECut"):
        return '', True
    if text.startswith("YUMEMismatch "):
        return '{{' + text[13:] + '}}', True

    return text, False


def yume_legacy_check(text: str) -> [str, bool]:
    if text.startswith("YUMEMismatch "):
        return '<' + text[13:] + '>', True

    return text, False


def fix_asteval_alias(text: str) -> str:
    modified_text = ""
    i = 0
    while i < len(text):
        if text[i:i + 2] == "||":
            modified_text += "||"
            i += 2
        elif text[i] == "|":
            modified_text += "||"
            i += 1
        if text[i:i + 2] == "&&":
            modified_text += "&&"
            i += 2
        elif text[i] == "&":
            modified_text += "&&"
            i += 1
        if text[i:i + 2] == "==":
            modified_text += "=="
            i += 2
        elif text[i] == "=":
            modified_text += "=="
            i += 1
        elif text[i] == "≤":
            modified_text += "<="
            i += 1
        elif text[i] == "≥":
            modified_text += ">="
            i += 1
        else:
            modified_text += text[i]
            i += 1
    return modified_text.replace("||", " or ").replace("&&", " and ").strip()


def fix_asteval_result(value) -> str:
    if isinstance(value, bool):
        if value:
            return '1'
        else:
            return '0'

    return str(value)


class CBSHelper:
    def __init__(self):
        self.data = ""

        self.global_vars = {}

        self.user = ''
        self.user_prompt = ''
        self.char = ''
        self.char_prompt = ''
        self.char_post_prompt = ''
        self.summaries = ''
        self.re_summaries = ''
        self.chat = ''
        self.conversations = ''
        self.message = ''
        self.message_count = 0
        self.parsed_lore_book = ''
        self.content = ''

        self.user_message = ''
        self.char_message = ''

        self.inputs = {}

    def put_data_with_room(self, room: Room):
        self.user = room.persona.name
        self.user_prompt = room.persona.prompt
        self.char = room.bot.name
        self.char_prompt = room.bot.prompt
        if room.bot.post_prompt:
            self.char_post_prompt = room.bot.post_prompt

    def check(self, text: str) -> [str, bool]:
        if text.startswith("#if "):
            sub_text = text[4:]
            if sub_text.strip() == "1":
                return "[[YUMEPass", True
            else:
                return "[[YUMECut", True

        if text.startswith("/if"):
            return "]]", True

        if text.startswith("getglobalvar"):
            key = text.split("::")[1]
            return self.global_vars.get(key, '0'), True

        if text.startswith("input_"):
            key = text.split("_")[1]
            return self.inputs.get(key, ''), True

        def calc(text: str):
            aeval = Interpreter()
            return fix_asteval_result(aeval.eval(fix_asteval_alias(text)))

        if text.startswith("?"):
            return calc(text[1:]), True

        if text.startswith("calc"):
            return calc(text[4:]), True

        if text.startswith("roll"):
            max_value = int(text.split("::")[1])
            return str(random.randint(1, max_value)), True

        if text.startswith("random"):
            values = text.split("::")[1:]
            return random.choice(values), True

        if text.startswith("equal"):
            [left, right] = text.split("::")[1:]
            if left == right:
                return '1', True
            else:
                return '0', True

        if text == 'messagecount' or text == "lastmessageid":
            return str(self.message_count), True

        if text == 'user':
            return self.user, True

        if text == 'user_prompt':
            return self.user_prompt, True

        if text == 'char':
            return self.char, True

        if text == 'char_prompt':
            return self.char_prompt, True

        if text == 'summaries':
            return self.summaries, True

        if text == 're_summaries':
            return self.re_summaries, True

        if text == 'chat':
            return self.chat, True

        if text == 'conversations':
            return self.conversations, True

        if text == 'raw_conversations':
            return self.conversations.replace("||user||\n", "user: ").replace("||assistant||\n", "assistant: "), True

        if text == 'message' or text == 'lastmessage':
            return self.message, True

        if text == 'content':
            return self.content, True

        if text == 'user_message':
            return self.user_message, True

        if text == 'char_message':
            return self.char_message, True

        if text == "post_prompt":
            return self.char_post_prompt, True

        if text == "lore_book":
            return self.parsed_lore_book, True

        return text, False
