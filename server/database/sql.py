import os

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine

import configure
from configure import use_encrypted_db


def get_engine(path: str = "_DEF_", password: str = ""):
    if path == "_DEF_":
        path = configure.get_fast_store_path("yumeAI.db")

    url = f"sqlite:///{path}"

    if password and use_encrypted_db():
        url = f"yumestore://:{password}@/{path}"
        engine = create_engine(
            url, connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            url, connect_args={"check_same_thread": False}
        )

    alembic_config = Config(os.path.join(os.path.dirname(configure.__file__), "alembic.ini"))
    alembic_config.set_main_option("sqlalchemy.url", url)
    alembic_config.set_main_option("script_location", os.path.join(os.path.dirname(configure.__file__), "alembic"))
    command.upgrade(alembic_config, "head")

    return engine
