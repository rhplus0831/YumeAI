from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select

from api import common
from database.sql_model import RoomBase, Room, Conversation, Bot, Persona, Prompt, Summary

router = APIRouter(prefix="/room", tags=["room"])
engine: Engine
room_not_exist_model: BaseModel | None = None


class RoomUpdate(BaseModel):
    name: str | None = None
    bot_id: int | None = None
    persona_id: int | None = None
    prompt_id: int | None = None
    summary_prompt_id: int | None = None
    re_summary_prompt_id: int | None = None
    translate_method: str | None = None
    translate_prompt_id: int | None = None
    translate_only_assistant: bool | None = None
    filters: str | None = None


class RoomGet(BaseModel):
    id: int
    name: str
    bot: Optional[Bot] = None
    persona: Optional[Persona] = None
    prompt: Optional[Prompt] = None
    summary_prompt: Optional[Prompt] = None
    re_summary_prompt: Optional[Prompt] = None
    translate_method: Optional[str] = None
    translate_prompt: Optional[Prompt] = None
    translate_only_assistant: bool
    filters: Optional[str] = None


common.validate_update_model(RoomBase, RoomUpdate)
common.validate_get_model(RoomBase, RoomGet)


def room_delete_side_effect(session: Session, room: Room):
    conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id)).all()
    for conversation in conversations:
        session.delete(conversation)

    summaries = session.exec(select(Summary).where(Summary.room_id == room.id)).all()
    for summary in summaries:
        session.delete(summary)

    session.commit()
