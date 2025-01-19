import os


def get_fast_store_path(path: str) -> str:
    # DB 등 용량이 작으면서 잦은 접근이 필요한 데이터를 저장할 공간?
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store-fast')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)


def get_store_path(path: str) -> str:
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)
