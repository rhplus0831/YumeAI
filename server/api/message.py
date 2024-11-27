import datetime
import enum
import json
import os
import uuid
from typing import Sequence

from fastapi import APIRouter
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import StreamingResponse

import configure
from api import common, prompt
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
        try:
            def generate_error(msg: str):
                return json.dumps({"status": 'error', "message": msg})

            if room.prompt is None:
                yield generate_error("프롬프트를 선택해야 합니다")
                return

            if room.bot is None:
                yield generate_error("봇을 선택해야 합니다")
                return

            if room.persona is None:
                yield generate_error("페르소나를 선택해야 합니다")
                return

            yield (json.dumps({
                'status': 'progress',
                'message': 'LLM에 메시지 요청중'
            })).encode('utf-8')
            # TODO: Support insert conversation in middle of prompt
            # TODO: Support LLM Selection
            # TODO: OpenAI class caching
            # 왜이리 미루는게 많아요?

            key_path = configure.get_store_path('openai_key')
            if not os.path.exists(key_path):
                yield generate_error("테스트용 OpenAI를 설정해야 합니다.")
                return

            with open(key_path, 'r', encoding='utf-8') as f:
                key = f.read().strip()

            oai = AsyncOpenAI(api_key=key)
            parsed_prompt = prompt.parse_prompt(room.prompt.prompt, {
                'user': lambda: room.persona.name,
                'user_prompt': lambda: room.persona.prompt,
                'char': lambda: room.bot.name,
                'char_prompt': lambda: room.bot.prompt,
            })
            messages = prompt.json_prompt(parsed_prompt)

            statement = select(Conversation).where(Conversation.room_id == room.id)
            conversations = session.exec(statement).all()

            conversations = conversations[-5:]
            for conversation in conversations:
                messages.append({
                    'role': 'user',
                    'content': conversation.user_message,
                })
                messages.append({
                    'role': 'assistant',
                    'content': conversation.assistant_message,
                })

            messages.append({
                'role': 'user',
                'content': argument.text
            })

            print(messages)

            response = await oai.chat.completions.create(model='gpt-4o', messages=messages, temperature=0.8,
                                                         max_tokens=512,
                                                         top_p=1,
                                                         frequency_penalty=0,
                                                         presence_penalty=0)

            conversation = Conversation()
            conversation.user_message = argument.text
            conversation.assistant_message = response.choices[0].message.content
            conversation.room_id = room.id
            conversation.created_at = datetime.datetime.now()

            session.add(conversation)
            session.commit()
            session.refresh(conversation)

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
        finally:
            session.close()

    @router.post("/{id}/message", responses={200: {'model': MessagesResponse}, 404: {'model': room_not_exist_model}})
    async def send_message(id: int, argument: SendMessageArgument) -> StreamingResponse:
        session = Session(engine)
        try:
            room = get_room_or_404(id, session=session)
        except:
            session.close()
            raise
        return StreamingResponse(send_message_streamer(argument, room, session), headers={
            'Content-Type': 'text/event-stream'
        })
