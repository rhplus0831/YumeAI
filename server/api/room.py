from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select

from api import common
from database.sql_model import RoomBase, Room, Conversation, Bot, Persona

router = APIRouter(prefix="/room", tags=["room"])
engine: Engine
room_not_exist_model: BaseModel | None = None


class RoomUpdate(BaseModel):
    name: str | None = None
    bot_id: int | None = None
    persona_id: int | None = None


class RoomGet(BaseModel):
    id: int
    name: str
    bot: Optional[Bot] = None
    persona: Optional[Persona] = None


common.validate_update_model(RoomBase, RoomUpdate)
common.validate_get_model(RoomBase, RoomGet)


def room_delete_side_effect(session: Session, room: Room):
    conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id)).all()
    for conversation in conversations:
        session.delete(conversation)
    session.commit()
