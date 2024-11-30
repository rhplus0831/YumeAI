import asyncio
import datetime
import json
import os
from typing import Sequence

from fastapi import APIRouter
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import StreamingResponse

import configure
from api import common, prompt
from database.sql_model import ConversationBase, Room, Conversation, Summary
from util.interface import messages_dump
from util.summary import summarize_conversation, need_summarize, summarize, get_summaries_and_re

engine: Engine
room_not_exist_model: BaseModel | None = None


class ConversationsResponse(BaseModel):
    conversations: Sequence[ConversationBase]


def get_room_or_404(room_id: int, session: Session) -> Room:
    return common.get_or_404(Room, session, room_id)


def register(router: APIRouter):
    @router.get('/{id}/conversation',
                responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
    async def list_conversations(id: int):
        with Session(engine) as session:
            room = get_room_or_404(id, session)
            statement = select(Conversation).where(Conversation.room_id == room.id)
            conversations = session.exec(statement).all()
        return {"conversations": conversations}

    class SendMessageArgument(BaseModel):
        text: str

    async def send_message_streamer(argument: SendMessageArgument, room: Room, session: Session):
        try:
            def generate_error(msg: str):
                return json.dumps({"status": 'error', "message": msg})

            def generate_progress(msg: str):
                return json.dumps({"status": 'progress', 'message': msg})

            if room.prompt is None:
                yield generate_error("프롬프트를 선택해야 합니다")
                return

            if room.bot is None:
                yield generate_error("봇을 선택해야 합니다")
                return

            if room.persona is None:
                yield generate_error("페르소나를 선택해야 합니다")
                return

            # TODO: Support insert conversation in middle of prompt
            # TODO: Support LLM Selection
            # TODO: OpenAI class caching
            # TODO: Support user select use summary | combine summary limit
            # 왜이리 미루는게 많아요? 그러게요?

            key_path = configure.get_store_path('openai_key')
            if not os.path.exists(key_path):
                yield generate_error("테스트용 OpenAI를 설정해야 합니다.")
                return

            with open(key_path, 'r', encoding='utf-8') as f:
                key = f.read().strip()

            statement = select(Conversation).where(Conversation.room_id == room.id).order_by(Conversation.created_at.desc()).limit(
                configure.get_max_conversation_count())
            conversations = session.exec(statement).all()
            conversations = sorted(conversations, key=lambda c: c.created_at)

            # 유저가 메시지를 새로 보내어 이전 대화를 확정한경우 요약합니다.
            if len(conversations) != 0:
                yield generate_progress('이전 대화를 요약하는중...')
                await summarize_conversation(session, conversations[-1])

            # 이전 요약으로 인해 새 응답을 요약해야 하는지 확인
            if await need_summarize(session, room):
                yield generate_progress('쌓인 요약을 재 요약하는중...')
                await summarize(session, room)

            all_summary_list = await get_summaries_and_re(session, room)

            combined_re_summary = ''
            combined_summary = ''

            summary: Summary
            for summary in all_summary_list:
                if summary.conversation_id is None:
                    combined_re_summary += summary.content + '\r\n'
                else:
                    combined_summary += summary.content + '\r\n'

            combined_summary = combined_summary.rstrip('\r\n')
            combined_re_summary = combined_summary.rstrip('\r\n')

            oai = AsyncOpenAI(api_key=key)
            parsed_prompt = prompt.parse_prompt(room.prompt.prompt, {
                'user': lambda: room.persona.name,
                'user_prompt': lambda: room.persona.prompt,
                'char': lambda: room.bot.name,
                'char_prompt': lambda: room.bot.prompt,
                'summaries': lambda: combined_summary,
                're_summaries': lambda: combined_re_summary,
            })
            messages = prompt.json_prompt(parsed_prompt)

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

            messages_dump(messages)

            yield generate_progress('봇이 응답하는중...')
            response = await oai.chat.completions.create(model='gpt-4o', messages=messages, temperature=0.8,
                                                         max_tokens=2048,
                                                         top_p=1,
                                                         frequency_penalty=0,
                                                         presence_penalty=0, stream=True)

            collected_messages = []
            async for chunk in response:
                chunk_message = chunk.choices[0].delta.content or ""
                collected_messages.append(chunk_message)
                yield json.dumps({
                    "status": 'stream',
                    "message": chunk_message
                }) + "\n"

            conversation = Conversation()
            conversation.user_message = argument.text
            conversation.assistant_message = ''.join(collected_messages)
            conversation.room_id = room.id
            conversation.created_at = datetime.datetime.now()

            session.add(conversation)
            session.commit()
            session.refresh(conversation)

            yield conversation.model_dump_json() + '\n'
            session.close()
            # Wait for client
            await asyncio.sleep(30)
        except:
            session.close()

    @router.post("/{id}/conversation/send",
                 responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
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
