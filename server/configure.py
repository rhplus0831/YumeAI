import os


def get_store_path(path: str) -> str:
    save = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../store')
    if not os.path.exists(save):
        os.makedirs(save)
    return os.path.join(save, path)