import json
from typing import Optional

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session

from api import common, image
from api.common import UsernameDependency, SessionDependency
from database.sql_model import BotBase, Bot

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