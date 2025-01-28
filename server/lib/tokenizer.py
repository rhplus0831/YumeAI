import tiktoken

from database.sql_model import Prompt

encoding = tiktoken.encoding_for_model("gpt-4o")


def get_tokens(text, prompt: Prompt | None = None):
    return encoding.encode(text)
