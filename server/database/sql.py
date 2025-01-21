import os

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, event
import configure


def get_engine(path: str = "_DEF_", password: str = ""):
    if path == "_DEF_":
        path = configure.get_fast_store_path("yumeAI.db")

    url = f"sqlite:///{path}"

    if password:
        url = f"yumestore://:{password}@/{path}"
        engine = create_engine(
            url, connect_args={"check_same_thread": False}
        )

        @event.listens_for(engine, "connect")
        def disable_regexp_on_connect(dbapi_connection, connection_record):
            # If REGEXP is not needed, we skip or safely adjust here.
            if hasattr(dbapi_connection, "create_function"):
                dbapi_connection.create_function("regexp", 2, None)  # Ensure only required arguments.

    else:
        engine = create_engine(
            url, connect_args={"check_same_thread": False}
        )

    alembic_config = Config(os.path.join(os.path.dirname(configure.__file__), "alembic.ini"))
    alembic_config.set_main_option("sqlalchemy.url", url)
    alembic_config.set_main_option("script_location", os.path.join(os.path.dirname(configure.__file__), "alembic"))
    command.upgrade(alembic_config, "head")

    return engine
