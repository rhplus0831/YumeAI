from typing import Sequence

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel
from sqlmodel import select
from starlette.responses import JSONResponse

from api import common
from api.common import SessionDependency, ClientErrorException
from database.sql_model import Summary, Conversation
from lib.summary import summarize_conversation


def register(room_router: APIRouter, app: FastAPI):
    class SummaryRestore(BaseModel):
        datas: Sequence[Summary]

    @app.post('/summary/restore')
    async def put_summary(summaries: SummaryRestore, session: SessionDependency, overwrite: str = 'false'):
        for data in summaries.datas:
            common.restore_data(data, Summary, overwrite, session)
        return JSONResponse(status_code=200, content={"status": "success"})

    @room_router.get('/{id}/summary/dump')
    async def dump_summaries(session: SessionDependency, id: str) -> Sequence[Summary]:
        items = session.exec(select(Summary).where(Summary.room_id == id)).all()
        return items

    @room_router.get('/{id}/summary/{conversation_id}')
    async def get_summary(session: SessionDependency, id: str, conversation_id: str):
        summary: Summary = session.exec(
            select(Summary).where(Summary.conversation_id == conversation_id)).one_or_none()
        if summary:
            return summary.model_dump()
        else:
            raise ClientErrorException(status_code=404, detail=f"Summary does not exist")

    @room_router.post('/{id}/summary/{conversation_id}/re_roll')
    async def re_roll_summary(session: SessionDependency, id: str, conversation_id: str):
        conversation: Conversation = session.exec(
            select(Conversation).where(Conversation.id == conversation_id)).one_or_none()
        summary: Summary = session.exec(
            select(Summary).where(Summary.conversation_id == conversation_id)).one_or_none()
        if summary and conversation:
            summary = await summarize_conversation(session, conversation, summary)
            return summary.model_dump()
