from sqlalchemy import create_engine
from sqlmodel import SQLModel

import configure


def get_engine(path: str = "_DEF_", create_meta: bool = True):
    if path == "_DEF_":
        path = configure.get_store_path("yumeAI.db")
    engine = create_engine(
        f"sqlite:///{path}", connect_args={"check_same_thread": False}
    )

    if create_meta:
        SQLModel.metadata.create_all(engine)

    return engine