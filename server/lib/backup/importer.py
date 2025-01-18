import json
import os
from typing import Type
from zipfile import ZipFile

from sqlmodel import Session, SQLModel, select

import configure
from database.sql_model import Room, Bot, Persona, Prompt, Image, Conversation, Summary


async def import_zip_file(session: Session, username: str, path: str):
    try:
        with ZipFile(path, 'r') as zip_file:
            meta = json.loads(zip_file.read('meta.json'))

            def load_table(table_name: str, data_model: Type[SQLModel]):
                table = meta[table_name]
                for inx, data_id in enumerate(table):
                    # TODO: Allow user to Adjust overwrite option
                    if data_model is Image:
                        data = zip_file.read(f'{table_name}/{data_id}.bin')
                        with open(configure.get_store_path(f'{username}/image/{data_id}'), 'wb') as f:
                            f.write(data)
                        if session.exec(select(data_model).where(data_model.file_id == data_id)).one_or_none():
                            continue
                    else:
                        if session.exec(select(data_model).where(data_model.id == data_id)).one_or_none():
                            continue
                    data = json.loads(zip_file.read(f'{table_name}/{data_id}.json'))
                    session.add(data_model.model_validate(data))

            load_table('rooms', Room)
            load_table('bots', Bot)
            load_table('personas', Persona)
            load_table('prompts', Prompt)
            os.makedirs(configure.get_store_path(f'{username}/image'), exist_ok=True)
            load_table('images', Image)
            load_table('conversations', Conversation)
            load_table('summaries', Summary)

            session.commit()
    except:
        session.rollback()
        raise
