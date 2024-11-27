import asyncio
import datetime
import enum
import json
import random
import uuid
from typing import Sequence

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import StreamingResponse

from api import common
from database.sql_model import Room, Conversation

engine: Engine
room_not_exist_model: BaseModel | None = None


class MessageRole(str, enum.Enum):
    USER = 'user'
    ASSISTANT = 'assistant'


class Message(BaseModel):
    text: str
    key: str
    role: MessageRole


class MessagesResponse(BaseModel):
    messages: Sequence[Message]


def get_room_or_404(room_id: int, session: Session) -> Room:
    return common.get_or_404(Room, session, room_id)


def register(router: APIRouter):
    @router.get('/{id}/message', responses={200: {'model': MessagesResponse}, 404: {'model': room_not_exist_model}})
    async def list_messages(id: int):
        with Session(engine) as session:
            room = get_room_or_404(id, session)
            statement = select(Conversation).where(Conversation.room_id == room.id)
            conversations = session.exec(statement).all()

        messages = []
        for conversation in conversations:
            # TODO: Remove name placeholder
            user_message = Message(text=conversation.user_message, key=uuid.uuid4().hex,
                                   role=MessageRole.USER)
            assistant_message = Message(text=conversation.assistant_message, key=uuid.uuid4().hex,
                                        role=MessageRole.ASSISTANT)
            messages.append(user_message)
            messages.append(assistant_message)

        return {"messages": messages}

    class SendMessageArgument(BaseModel):
        text: str

    async def send_message_streamer(argument: SendMessageArgument, room: Room, session: Session):
        yield (json.dumps({
            'status': 'progress',
            'message': '서버가 농땡이 피는중'
        })).encode('utf-8')
        await asyncio.sleep(5)

        yield (json.dumps({
            'status': 'progress',
            'message': 'LLM에 메시지 요청중'
        })).encode('utf-8')
        await asyncio.sleep(5)
        # TODO: Change it to real talk with bot
        conversation = Conversation()
        conversation.user_message = argument.text
        conversation.assistant_message = random.choice([
            "Hello, YumeAI!",
            "아, 채팅하고 싶다~!\n큰 소리로 말하지마 등신아!",
            "You Make My Life 1UP"])
        conversation.room_id = room.id
        conversation.created_at = datetime.datetime.now()

        session.add(conversation)
        session.commit()

        yield json.dumps({
            "messages": [
                {
                    'text': conversation.user_message,
                    'key': uuid.uuid4().hex,
                    'role': MessageRole.USER
                },
                {
                    'text': conversation.assistant_message,
                    'key': uuid.uuid4().hex,
                    'role': MessageRole.ASSISTANT
                }
            ]
        }).encode('utf-8')

    @router.post("/{id}/message", responses={200: {'model': MessagesResponse}, 404: {'model': room_not_exist_model}})
    async def send_message(id: int, argument: SendMessageArgument) -> StreamingResponse:
        with Session(engine) as session:
            room = get_room_or_404(id, session=session)
            return StreamingResponse(send_message_streamer(argument, room, session), headers={
                'Content-Type': 'text/event-stream'
            })
