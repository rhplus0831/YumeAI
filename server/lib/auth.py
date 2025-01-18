import re

pattern = r"^[a-z0-9A-Z_-]+$"

def check_id_valid(id: str):
    return bool(re.fullmatch(pattern, id))