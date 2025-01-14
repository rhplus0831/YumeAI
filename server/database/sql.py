import logging
import os

from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine
from sqlmodel import SQLModel

import configure


def get_engine(path: str = "_DEF_", create_meta: bool = True):
    if path == "_DEF_":
        path = configure.get_store_path("yumeAI.db")

    engine = create_engine(
        f"sqlite:///{path}", connect_args={"check_same_thread": False}
    )

    alembic_config = Config( os.path.join(os.path.dirname(configure.__file__), "alembic.ini") )
    alembic_config.set_main_option("sqlalchemy.url", f"sqlite:///{path}")
    alembic_config.set_main_option("script_location", os.path.join(os.path.dirname(configure.__file__), "alembic") )
    command.upgrade(alembic_config, "head")

    return engine
