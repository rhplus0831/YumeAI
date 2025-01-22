import json
import os
from typing import Type
from zipfile import ZipFile

from sqlmodel import Session, SQLModel, select

import configure
from database.sql_model import Room, Bot, Persona, Prompt, Image, Conversation, Summary
from lib.storage import put_file


# TODO: Move it client or provide some progress notify
async def import_zip_file(session: Session, username: str, path: str):
    try:
        with ZipFile(path, 'r') as zip_file:
            meta = json.loads(zip_file.read('meta.json'))

            async def load_table(table_name: str, data_model: Type[SQLModel]):
                table = meta[table_name]
                for inx, data_id in enumerate(table):
                    # TODO: Allow user to Adjust overwrite option
                    if data_model is Image:
                        data = zip_file.read(f'{table_name}/{data_id}.bin')
                        put_file(data, data_model.file_path)
                        if session.exec(select(data_model).where(data_model.file_id == data_id)).one_or_none():
                            continue
                    else:
                        if session.exec(select(data_model).where(data_model.id == data_id)).one_or_none():
                            continue
                    data = json.loads(zip_file.read(f'{table_name}/{data_id}.json'))
                    session.add(data_model.model_validate(data))

            await load_table('rooms', Room)
            await load_table('bots', Bot)
            await load_table('personas', Persona)
            await load_table('prompts', Prompt)
            os.makedirs(configure.get_store_path(f'{username}/image'), exist_ok=True)
            await load_table('images', Image)
            await load_table('conversations', Conversation)
            await load_table('summaries', Summary)

            session.commit()
    except:
        session.rollback()
        raise
