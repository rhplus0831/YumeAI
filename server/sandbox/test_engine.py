import os

import configure
from database.sql import get_engine

if __name__ == "__main__":
    test_db_path = configure.get_store_path('yumeAI_engine.db')
    get_engine(test_db_path, 'b1bca3358dce18fb0a0d50f1bba5a01272d6ed0b90c4f0888c19ae721035f49891eb28154352a739bd02529fbd8f5a8f174c71cd6fdbdb8b304372e2013b7a79')