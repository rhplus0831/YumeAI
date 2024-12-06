from typing import Optional, List

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, Field

from api import common, image
from database.sql_model import BotBase, Bot

router = APIRouter(prefix="/bot", tags=["bot"])
# noinspection DuplicatedCode
engine: Engine
bot_not_exist_model: BaseModel | None = None


class BotUpdate(BaseModel):
    name: str | None = None
    displayName: str | None = None
    profileImageId: str | None = None
    prompt: str | None = None
    first_message: str | None = None


class BotGet(BaseModel):
    id: int
    name: str
    displayName: str
    profileImageId: Optional[str] = None
    prompt: str
    first_message: Optional[str] = None


common.validate_update_model(BotBase, BotUpdate)
common.validate_get_model(BotBase, BotGet)


def get_bot_or_404(bot_id: int, session: Session) -> Bot:
    return common.get_or_404(Bot, session, bot_id)


def register():
    @router.post('/{id}/profile_image', responses={200: {'model': Bot}, 404: {'model': bot_not_exist_model}})
    async def update_profile_image(id: int, image_file: UploadFile) -> Bot:
        with Session(engine) as session:
            bot = get_bot_or_404(id, session)

        if bot.profileImageId is not None:
            await image.delete_image(file_id=bot.profileImageId)

        uploaded = await image.upload_image(image_file)
        bot.profileImageId = uploaded.file_id

        with Session(engine) as session:
            session.add(bot)
            session.commit()
            session.refresh(bot)

        return bot
