import re

def process_content(text, custom_logic):
    """
    중첩된 {{}} 안의 내용을 추출하고 커스텀 로직을 적용하여 값을 변경합니다.

    Args:
        text: 처리할 문자열입니다.
        custom_logic: 추출된 내용에 적용할 커스텀 로직 함수입니다.
                      이 함수는 추출된 문자열을 인자로 받아 처리된 문자열을 반환해야 합니다.

    Returns:
        커스텀 로직이 적용된 문자열입니다.
    """
    def find_innermost(text):
        """가장 안쪽의 {{}} 블록을 찾습니다."""
        open_indices = [m.start() for m in re.finditer(r'{{', text)]
        close_indices = [m.start() for m in re.finditer(r'}}', text)]

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
        content = text[start + 2:end]
        processed_content = custom_logic(content)
        new_text = text[:start] + processed_content + text[end + 2:]
        return process_content(new_text, custom_logic) # 재귀 호출
    else:
        return text

# 커스텀 확인 로직 예시
def my_custom_logic(content):
    if content == "name":
        return "김철수"
    elif content == "age":
        return "30"
    elif content.startswith("calc_"):
        try:
            return str(eval(content[5:])) # 간단한 계산 로직
        except:
            return content
    return f"<{content}>" # 매칭되는 로직이 없으면 <> 로 감싸서 반환

# 중첩된 {{}} 예시
content = "안녕하세요, 제 이름은 {{name}}이고, 나이는 {{age}}세 입니다. {{calc_{{age}}+5}}년 후에는 {{calc_30+5}}세가 되겠네요."
result = process_content(content, my_custom_logic)
print(result)