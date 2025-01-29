import json
from typing import Optional

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session, select

from api import common, image
from api.common import UsernameDependency, SessionDependency, ClientErrorException
from database.sql_model import BotBase, Bot, LoreBook

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
    lore_book_id: Optional[str] = None


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
    lore_book_id: Optional[str] = None


common.validate_update_model(BotBase, BotUpdate, ['lore_book_id'])
common.validate_get_model(BotBase, BotGet, ['lore_book_id', 'lore_book'])


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

    @router.post('/{id}/lorebook')
    def create_lorebook(session: SessionDependency, id: str):
        bot = get_bot_or_404(id, session)

        if bot.lore_book_id is not None:
            book = session.exec(select(LoreBook).where(LoreBook.id == bot.lore_book_id)).one_or_none()
            if book is not None:
                raise ClientErrorException(status_code=400, detail='Bot already has lorebook')

        lorebook = LoreBook()
        lorebook.name = f'{bot.name}의 로어북'
        lorebook.description = ''
        session.add(lorebook)
        session.commit()
        session.refresh(lorebook)
        bot.lore_book_id = lorebook.id
        session.add(bot)
        session.commit()
        session.refresh(bot)
        return bot
