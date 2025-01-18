import re

pattern = r"^[a-zA-Z_-]+$"

def check_id_valid(id: str):
    return bool(re.fullmatch(pattern, id))