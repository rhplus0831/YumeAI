import os
import sqlite3
import pysqlcipher3.dbapi2 as sqlitecipher

import configure


def get_data_from_plaintext_db(path):
    # 기존의 평문 데이터베이스 연결
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    # 모든 데이터를 가져오기
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    data = {}
    for table_name in tables:
        table_name = table_name[0]
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()

        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [column[1] for column in cursor.fetchall()]

        data[table_name] = (columns, rows)

    conn.close()
    return data


def create_encrypted_db(path, data, password):
    # 암호화된 데이터베이스 파일 생성
    conn = sqlitecipher.connect(path)
    cursor = conn.cursor()

    # 암호 설정
    cursor.execute(f"PRAGMA key='{password}'")

    # 데이터를 복사하여 새로운 암호화된 데이터베이스에 삽입
    for table_name, (columns, rows) in data.items():
        columns_str = ', '.join(columns)
        cursor.execute(f"CREATE TABLE {table_name} ({columns_str});")
        for row in rows:
            placeholders = ', '.join(['?'] * len(row))
            cursor.execute(f"INSERT INTO {table_name} VALUES ({placeholders})", row)

    conn.commit()
    conn.close()


def encrypt_plain_db(path, password):
    plain_db = path
    encrypt_db = path + '.encrypt'
    data = get_data_from_plaintext_db(plain_db)
    create_encrypted_db(encrypt_db, data, password)

    os.remove(plain_db)
    os.rename(encrypt_db, plain_db)


if __name__ == '__main__':
    fast_store_path = os.path.dirname(configure.get_fast_store_path('dummy'))
    for file in os.listdir(fast_store_path):
        path = os.path.join(fast_store_path, file)
        if not os.path.isdir(path):
            continue
        password_path = os.path.join(fast_store_path, file, 'password')
        if not os.path.exists(password_path):
            continue

        with open(password_path, 'r') as f:
            password = f.read()

        encrypt_plain_db(os.path.join(fast_store_path, file, 'yumeAI.db'), password)
        os.remove(password_path)

