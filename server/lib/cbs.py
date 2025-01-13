# Support layer for risu cbs
# https://kwaroran.github.io/docs/syntax/cbs/


def yume_cutter_check(text: str) -> [str, bool]:
    if text.startswith("YUMEPass"):
        return text[8:], True
    if text.startswith("YUMECut"):
        return '', True

    return text, False


class CBSHelper:
    def __init__(self):
        self.data = ""

        self.global_vars = {}

        self.user = ''
        self.user_prompt = ''
        self.char = ''
        self.char_prompt = ''
        self.summaries = ''
        self.re_summaries = ''
        self.chat = ''
        self.conversations = ''
        self.message = ''

        self.content = ''

        self.user_message = ''
        self.char_message = ''

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
            return self.global_vars.get(key, 'undefined'), True

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

        if text == 'message':
            return self.message, True

        if text == 'content':
            return self.content, True

        if text == 'user_message':
            return self.content, True

        if text == 'char_message':
            return self.content, True

        return text, False
