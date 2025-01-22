import json
import mimetypes
import os
import uuid
from io import BytesIO
from typing import Optional
from zipfile import ZipFile

import aiofiles
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session
from starlette.responses import JSONResponse

import configure
from api import common, image
from api.common import EngineDependency, UsernameDependency, ClientErrorException, SessionDependency
from database.sql_model import BotBase, Bot
from lib.storage import put_file

router = APIRouter(prefix="/bot", tags=["bot"])
bot_not_exist_model: BaseModel | None = None


class BotUpdate(BaseModel):
    name: str | None = None
    displayName: str | None = None
    profileImageId: str | None = None
    prompt: str | None = None
    post_prompt: str | None = None
    first_message: str | None = None
    filters: str | None = None
    image_assets: str | None = None


class BotGet(BaseModel):
    id: str
    name: str
    displayName: str
    profileImageId: Optional[str] = None
    prompt: str
    post_prompt: Optional[str] = None
    first_message: Optional[str] = None
    filters: Optional[str] = None
    image_assets: Optional[str] = None


common.validate_update_model(BotBase, BotUpdate)
common.validate_get_model(BotBase, BotGet)


def get_bot_or_404(bot_id: str, session: Session) -> Bot:
    return common.get_or_404(Bot, session, bot_id)


async def bot_delete_side_effect(session: Session, username: str, bot: Bot):
    if bot.profileImageId is not None:
        try:
            await image.delete_image(session, username, file_id=bot.profileImageId)
        except:
            pass

    if bot.image_assets is not None:
        assets = json.loads(bot.image_assets)
        for asset in assets:
            try:
                await image.delete_image(session, username, file_id=asset['imageId'])
            except:
                pass


def register():
    @router.post('/{id}/profile_image', responses={200: {'model': Bot}, 404: {'model': bot_not_exist_model}})
    async def update_profile_image(session: SessionDependency, username: UsernameDependency, id: str,
                                   image_file: UploadFile) -> Bot:
        bot = get_bot_or_404(id, session)

        if bot.profileImageId is not None:
            await image.delete_image(session, username, file_id=bot.profileImageId)

        uploaded = await image.upload_image(session, username, image_file)
        bot.profileImageId = uploaded.file_id
        session.add(bot)
        session.commit()
        session.refresh(bot)

        return bot

    @router.post('/import', responses={200: {'model': Bot}})
    async def import_bot(session: SessionDependency, username: UsernameDependency, in_file: UploadFile):
        if in_file.size > 500 * 1024 * 1024:
            raise ClientErrorException(status_code=413, detail="File too large")

        path = configure.get_store_path(f'{username}/import_{uuid.uuid4().hex}.zip')
        try:
            async with aiofiles.open(path, 'wb') as out_file:
                while content := await in_file.read(1024):  # async read chunk
                    await out_file.write(content)  # async write chunk

            with ZipFile(path, 'r') as zip_file:
                card = json.loads(zip_file.read('card.json'))
                if card['spec'] != 'chara_card_v3':
                    raise ClientErrorException(status_code=400, detail="Invalid file")
                data = card['data']

                bot = Bot()
                bot.name = data['name']
                bot.displayName = data['nickname']
                bot.prompt = data['description']

                first_messages = []
                image_assets = []

                def safe_get(key):
                    return data[key] if key in data else ''

                if safe_get('first_mes'):
                    first_messages.append({
                        'name': '기본',
                        'message': data['first_mes']
                    })

                if safe_get('alternate_greetings'):
                    for inx, greeting in enumerate(data['alternate_greetings']):
                        first_messages.append({
                            'name': f'{inx}번째 메시지',
                            'message': greeting
                        })

                if safe_get('post_history_instructions'):
                    bot.post_prompt = data['post_history_instructions']

                if safe_get('assets'):
                    threads = []
                    for asset in data['assets']:
                        type = asset['type']
                        uri = asset['uri']
                        name = asset['name']
                        ext = asset['ext']
                        mime = mimetypes.guess_type("data." + ext)[0]

                        if not uri.startswith('embeded://'):
                            continue

                        inner_path = uri.replace('embeded://', '')

                        def import_image():
                            image_data, file_path = image.generate_new_image(session, username, mime)
                            image_file_data = zip_file.read(inner_path)
                            put_file(image_file_data, file_path)

                            return image_data

                        if type == "icon":
                            image_data = import_image()
                            bot.profileImageId = image_data.file_id
                        else:
                            if mime is None:
                                continue

                            if mime.startswith('image/'):
                                image_data = import_image()
                                image_assets.append({
                                    'name': name,
                                    'alias': '',
                                    'imageId': image_data.file_id
                                })

                bot.first_message = json.dumps(first_messages)
                bot.image_assets = json.dumps(image_assets)

                session.add(bot)
                session.commit()
                session.refresh(bot)

                return JSONResponse(bot.model_dump_json())
        finally:
            os.remove(path)
