import datetime
from typing import Optional, Sequence

from fastapi import APIRouter
from fastapi.params import Query
from pydantic import BaseModel, create_model
from sqlalchemy import Engine
from sqlmodel import Session, select, desc
from starlette.responses import JSONResponse

from api import common
from api.common import SessionDependency, UsernameDependency
from database.sql_model import RoomBase, Room, Conversation, Bot, Persona, Prompt, Summary
from lib.backup.exporter import DataExporter

router = APIRouter(prefix="/room", tags=["room"])
engine: Engine
room_not_exist_model: BaseModel | None = None


class RoomUpdate(BaseModel):
    name: str | None = None
    bot_id: str | None = None
    persona_id: str | None = None
    prompt_id: str | None = None
    summary_prompt_id: str | None = None
    re_summary_prompt_id: str | None = None
    translate_method: str | None = None
    translate_prompt_id: str | None = None
    translate_only_assistant: bool | None = None
    filters: str | None = None
    last_message_time: datetime.datetime | None = None
    display_option: str | None = None


class RoomGet(BaseModel):
    id: str
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

    last_message_time: datetime.datetime | None = None
    display_option: Optional[str] = None


common.validate_update_model(RoomBase, RoomUpdate)
common.validate_get_model(RoomBase, RoomGet)


async def room_delete_side_effect(session: Session, username: str, room: Room):
    conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id)).all()
    for conversation in conversations:
        session.delete(conversation)

    summaries = session.exec(select(Summary).where(Summary.room_id == room.id)).all()
    for summary in summaries:
        session.delete(summary)

    session.commit()


def register():
    data_name = Room.__name__
    lower_name = data_name.lower()
    list_data = {
        f'{lower_name}s': (Sequence[RoomGet], None)
    }
    list_model = create_model(f'{data_name}List', **list_data)

    def get_session():
        with Session(engine) as session:
            yield session

    @router.get("", responses={200: {'model': list_model}, 404: {'model': room_not_exist_model}})
    def gets(session: SessionDependency, offset: int = 0, limit: int = Query(default=100, le=100)) -> Sequence[
        RoomGet]:
        rooms = session.exec(
            select(Room).order_by(desc(Room.last_message_time)).offset(offset).limit(limit)
        ).all()

        return rooms

    @router.post("/{id}/export")
    def export(session: SessionDependency, username: UsernameDependency, id: str):
        room = common.get_or_404(Room, session, id)
        exporter = DataExporter(session, username)
        exporter.export_room(room)
        exporter.finish()

        return JSONResponse({"uuid": exporter.uuid})
