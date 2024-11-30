import os

# 요약공간중 재요약 공간에 들어갈 수 있는 최대 갯수
def get_max_re_summary_count():
    return 3

# 요약공간중 최근(대화) 공간에 들어갈 수 있는 최대 갯수
def get_max_summary_count():
    return 3

# 요약없이 들어가는 최대 대화수
def get_max_conversation_count():
    return 3


def get_store_path(path: str) -> str:
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)
