import re

pattern = r"^[a-z0-9A-Z_-]+$"

def check_id_valid(id: str):
    return bool(re.fullmatch(pattern, id))


def check_pw_valid(pw: str):
    # 클라이언트가 해시된 결과만을 제출하기에, 128자 인지 확인하면 됨
    return len(pw) == 128