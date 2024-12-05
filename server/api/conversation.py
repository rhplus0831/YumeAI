import datetime
import json
import os
from typing import Sequence

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import StreamingResponse

import configure
from api import common
from database.sql_model import ConversationBase, Room, Conversation, Summary
from util import interface
from util.summary import summarize_conversation, need_summarize, summarize, get_summaries_and_re

engine: Engine
room_not_exist_model: BaseModel | None = None


def generate_error(msg: str):
    return json.dumps({"status": 'error', "message": msg}) + '\n'


def generate_progress(msg: str):
    return json.dumps({"status": 'progress', 'message': msg}) + '\n'


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

    key_path = configure.get_store_path('openai_key')
    if not os.path.exists(key_path):
        print("테스트용 키가 설정되어 있지 않습니다, 대화 API의 등록을 하지 않습니다.")
        return

    with open(key_path, 'r', encoding='utf-8') as f:
        key = f.read().strip()

    async def send_message_streamer(argument: SendMessageArgument, room: Room, session: Session):
        try:
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

            statement = select(Conversation).where(Conversation.room_id == room.id).order_by(
                Conversation.created_at.desc()).limit(
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

            insert_messages = []

            for conversation in conversations:
                insert_messages.append({
                    'role': 'user',
                    'content': conversation.user_message,
                })
                insert_messages.append({
                    'role': 'assistant',
                    'content': conversation.assistant_message,
                })

            insert_messages.append({
                'role': 'user',
                'content': argument.text
            })

            bot_response = ''

            def receiver(rep: str):
                nonlocal bot_response
                bot_response = rep

            async for value in interface.stream_prompt(room.prompt, {
                'user': lambda: room.persona.name,
                'user_prompt': lambda: room.persona.prompt,
                'char': lambda: room.bot.name,
                'char_prompt': lambda: room.bot.prompt,
                'summaries': lambda: combined_summary,
                're_summaries': lambda: combined_re_summary,
            }, insert_messages, receiver):
                yield value

            conversation = Conversation()
            conversation.user_message = argument.text
            conversation.assistant_message = bot_response
            conversation.room_id = room.id
            conversation.created_at = datetime.datetime.now()

            session.add(conversation)
            session.commit()
            session.refresh(conversation)

            yield conversation.model_dump_json() + '\n'
        finally:
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

    async def translate_message_streamer(conversation: Conversation, room: Room, session: Session):
        try:
            # TODO: 번역 방법 선택할 수 있게 하기
            # if room.translate_method is None:
            #     yield generate_error("번역 방법을 선택해야 합니다")
            #     return
            #
            # if room.translate_method == "google":
            #     # TODO: 번역을 한번에 할 수 없으므로, 단위를 어떻게 쪼갤지 고민해보기
            #     yield generate_error("구현이 안되었습니다 :(")
            #     return
            # elif room.translate_method == "prompt":

            if room.translate_prompt_id is None:
                yield generate_error("번역 방법이 프롬프트 이지만 선택된 프롬프트가 없습니다")
                return

            yield generate_progress('유저의 메시지를 번역하는중...')

            user_response = ''

            def user_receiver(rep: str):
                nonlocal user_response
                user_response = rep

            async for value in interface.stream_prompt(room.translate_prompt,
                                                       {'content': lambda: conversation.user_message}, [
                                                           {'role': 'user', 'content': conversation.user_message},
                                                       ], user_receiver):
                yield value

            yield generate_progress('봇의 메시지를 번역하는중...')
            yield json.dumps({
                'status': 'stream',
                'message': 'yume||switch'
            }) + '\n'

            assistant_response = ''

            def user_receiver(rep: str):
                nonlocal assistant_response
                assistant_response = rep

            async for value in interface.stream_prompt(room.translate_prompt,
                                                       {'content': lambda: conversation.assistant_message}, [
                                                           {'role': 'assistant',
                                                            'content': conversation.assistant_message},
                                                       ], user_receiver):
                yield value

            conversation.user_message_translated = user_response
            conversation.assistant_message_translated = assistant_response

            session.add(conversation)
            session.commit()
            session.refresh(conversation)

            yield conversation.model_dump_json() + '\n'
        finally:
            session.close()

    @router.post("/{id}/conversation/{conversation_id}/translate",
                 responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
    async def translate_conversation(id: int, conversation_id: int) -> StreamingResponse:
        session = Session(engine)
        try:
            room = get_room_or_404(id, session=session)
            conversation = common.get_or_404(Conversation, session, conversation_id)
            if conversation.room_id != room.id:
                raise Exception("Conversation Room ID doesn't match")
        except:
            session.close()
            raise
        return StreamingResponse(translate_message_streamer(conversation, room, session), headers={
            'Content-Type': 'text/event-stream'
        })
