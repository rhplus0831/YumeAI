import datetime
import logging
import random
import re
from typing import Sequence, Optional, Callable

from fastapi import APIRouter, FastAPI, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from starlette.responses import StreamingResponse, JSONResponse

import settings
from api import common
from api.common import SessionDependency, EngineDependency, ClientErrorException
from database.sql_model import ConversationBase, Room, Conversation, Summary
from lib.cbs import CBSHelper
from lib.filter import apply_filter, remove_cot_string
from lib.llm import llm_common
from lib.prompt import parse_prompt
from lib.summary import summarize_conversation, need_summarize, summarize, get_re_summaries, get_summaries
from lib.web import generate_event_stream_message

room_not_exist_model: BaseModel | None = None


def generate_error(msg: str):
    return generate_event_stream_message('error', msg)


def generate_progress(msg: str):
    return generate_event_stream_message('progress', msg)


class ConversationsResponse(BaseModel):
    conversations: Sequence[ConversationBase]


def get_room_or_404(room_id: str, session: Session) -> Room:
    return common.get_or_404(Room, session, room_id)


def register(room_router: APIRouter, app: FastAPI):
    @room_router.get('/{id}/conversation',
                     responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
    async def list_conversations(session: SessionDependency, id: str, offset: int = 0, limit: int = Query(default=100)):
        room = get_room_or_404(id, session)
        items = session.exec(
            select(Conversation).where(Conversation.room_id == room.id).offset(offset).limit(limit)).all()
        return items

    @room_router.get('/{id}/conversation/dump')
    async def dump_conversations(session: SessionDependency, id: str) -> Sequence[Conversation]:
        room = get_room_or_404(id, session)
        items = session.exec(select(Conversation).where(Conversation.room_id == room.id)).all()
        return items

    class ConversationRestore(BaseModel):
        datas: Sequence[dict]

    @app.post('/conversation/restore')
    async def put_conversation(conversations: ConversationRestore, session: SessionDependency,
                               overwrite: str = 'false'):
        for data in conversations.datas:
            common.restore_data(data, Conversation, overwrite, session)
        return JSONResponse(status_code=200, content={"status": "success"})

    class SingleTextArgument(BaseModel):
        text: str

    class ReRollArgument(BaseModel):
        active_toggles: str

    class SendMessageArgument(BaseModel):
        text: str
        active_toggles: str

    async def send_message_streamer(argument: SendMessageArgument, room: Room, session: Session,
                                    custom_conversation_id: Optional[str] = None):
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

            user_new_message = apply_filter(room, 'input', argument.text)

            max_conversation_count = settings.get_max_conversation_count(session)

            statement = select(Conversation).where(Conversation.room_id == room.id).order_by(
                Conversation.created_at.desc()).limit(max_conversation_count)
            conversations = session.exec(statement).all()
            conversations = sorted(conversations, key=lambda c: c.created_at)

            if custom_conversation_id:
                def cut_selected(conversation: Conversation):
                    return conversation.id != custom_conversation_id

                conversations = list(filter(cut_selected, conversations))

            # 유저가 메시지를 새로 보내어 이전 대화를 확정한경우 요약합니다.
            if len(conversations) != 0:
                yield generate_progress('이전 대화를 요약하는중...')
                await summarize_conversation(session, conversations[-1])

            # 이전 요약으로 인해 새 응답을 요약해야 하는지 확인
            if await need_summarize(session, room):
                yield generate_progress('쌓인 요약을 재 요약하는중...')
                await summarize(session, room)

            combined_re_summary = ''
            combined_summary = ''

            for summary in await get_re_summaries(session, room):
                combined_re_summary += summary.content + '\r\n'

            summaries = await get_summaries(session, room)
            if len(summaries) > max_conversation_count:
                # max_conversation_count 보다 메시지의 요약이 많아 진경우 이전 메시지는 잘리기 때문에 요약을 넣어줌
                summaries = summaries[0:len(summaries) - max_conversation_count]
                for summary in summaries:
                    combined_summary += summary.content + '\r\n'

            combined_summary = combined_summary.rstrip('\r\n')
            combined_re_summary = combined_re_summary.rstrip('\r\n')

            conversation_converted = []

            for conversation in conversations:
                conversation_converted.append(f'||user||\n{conversation.user_message}\n')
                conversation_converted.append(f'||assistant||\n{remove_cot_string(conversation.assistant_message)}\n')

            message = f'||user||\n{user_new_message}\n'
            chat_combined = conversation_converted[:]
            chat_combined.append(f'||user||\n{user_new_message}\n')

            bot_response = ''

            def receiver(rep: str):
                nonlocal bot_response
                bot_response = rep

            yield generate_progress('봇이 응답하는중...')

            cbs = CBSHelper()
            cbs.user = room.persona.name
            cbs.user_prompt = room.persona.prompt
            cbs.char = room.bot.name
            cbs.char_prompt = room.bot.prompt
            if room.bot.post_prompt:
                cbs.char_post_prompt = room.bot.post_prompt
            cbs.summaries = combined_summary
            cbs.re_summaries = combined_re_summary
            cbs.chat = ''.join(chat_combined)
            cbs.conversations = ''.join(conversation_converted)
            cbs.message = message
            cbs.message_count = len(conversations)

            if argument.active_toggles:
                for active_toggle in argument.active_toggles.split(','):
                    cbs.global_vars[f"toggle_{active_toggle}"] = '1'

            if room.prompt.use_stream:
                async for value in llm_common.stream_prompt(room.prompt, cbs, session, receiver):
                    yield value
            else:
                bot_response = await llm_common.perform_prompt(room.prompt, cbs, session)

            if custom_conversation_id:
                conversation = session.exec(
                    select(Conversation).where(Conversation.id == custom_conversation_id)).one_or_none()
            else:
                conversation = Conversation()

            conversation.user_message = user_new_message
            conversation.assistant_message = apply_filter(room, 'output', bot_response)
            conversation.assistant_message_translated = ''
            conversation.room_id = room.id

            conversation.created_at = datetime.datetime.now()
            room.last_message_time = datetime.datetime.now()

            session.add(conversation)
            session.add(room)
            session.commit()
            session.refresh(conversation)

            yield generate_event_stream_message('complete', conversation.model_dump_json())
        except Exception as e:
            logging.exception(e)
            yield generate_event_stream_message('error', str(e))
        finally:
            session.close()

    @room_router.post("/{id}/conversation/send",
                      responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
    async def send_message(engine: EngineDependency, id: str, argument: SendMessageArgument) -> StreamingResponse:
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
            if room.translate_method != "prompt":
                yield generate_error("번역 방법이 프롬프트가 아닙니다.")
                return

            if room.translate_prompt_id is None:
                yield generate_error("번역 방법이 프롬프트 이지만 선택된 프롬프트가 없습니다")
                return

            user_response = ''
            assistant_response = ''

            def user_receiver(rep: str):
                nonlocal user_response
                user_response = rep

            def assistant_receiver(rep: str):
                nonlocal assistant_response
                assistant_response = rep

            filtered_user_message = apply_filter(room, "display", conversation.user_message)

            if conversation.assistant_message.startswith("<COT>"):
                cot, filtered_assistant_message = conversation.assistant_message.split("</COT>")
                cot = cot[5:]
            else:
                cot = ''
                filtered_assistant_message = conversation.assistant_message

            filtered_assistant_message = apply_filter(room, "display", filtered_assistant_message)

            async def perform_translate(content: str, complete_receiver: Callable[[str], None]):
                parts = re.split(r"{{(.*?)}}", content)
                replaced_bucket = {}
                rebuilded_content = []

                def check_exist(matched_string: str):
                    return matched_string in replaced_bucket

                def replace_hashed_bucket(match_obj):
                    matched_string = match_obj.group(0)
                    if check_exist(matched_string):
                        return replaced_bucket[matched_string]
                    else:
                        return matched_string

                for i in range(len(parts)):
                    # 홀수 인덱스는 매칭된 데이터
                    if i % 2 == 1:
                        random_uuid = ''.join(random.choices('0123456789', k=6))
                        random_uuid = f"_{random_uuid}_"
                        replaced_bucket[random_uuid] = "{{" + parts[i] + "}}"
                        rebuilded_content.append(random_uuid)
                    else:
                        rebuilded_content.append(parts[i])

                cbs = CBSHelper()
                cbs.content = ''.join(rebuilded_content)

                uuid_pattern = r"(_[0-9]+?_)"

                if room.translate_prompt.use_stream:
                    buffer = []
                    internal_complete_buffer = []

                    def process_buffer(flush=False):
                        nonlocal buffer, internal_complete_buffer
                        inner_buffer = ''.join(buffer)
                        _count = inner_buffer.count('_')
                        if _count > 0:
                            if _count > 1:
                                before = inner_buffer
                                inner_buffer = re.sub(uuid_pattern, replace_hashed_bucket, inner_buffer)
                            else:
                                if len(inner_buffer) - inner_buffer.index('_') < 15:
                                    if not flush:
                                        return None

                        internal_complete_buffer.append(inner_buffer)
                        buffer.clear()
                        return generate_event_stream_message('stream', inner_buffer)

                    async for value in llm_common.stream_prompt(room.translate_prompt, cbs, session, None, False):
                        buffer.append(value)
                        result = process_buffer()
                        if result:
                            yield result

                    if len(buffer) > 0:
                        yield process_buffer(True)

                    complete_receiver(''.join(internal_complete_buffer))
                else:
                    result = re.sub(uuid_pattern, replace_hashed_bucket,
                                    await llm_common.perform_prompt(room.translate_prompt, cbs, session))
                    yield result
                    complete_receiver(result)

            if not room.translate_only_assistant and filtered_user_message:
                yield generate_progress('유저의 메시지를 번역하는중...')

                async for value in perform_translate(filtered_user_message, user_receiver):
                    yield value

            yield generate_progress('봇의 메시지를 번역하는중...')
            yield generate_event_stream_message('stream', 'yume||switch')

            async for value in perform_translate(filtered_assistant_message, assistant_receiver):
                yield value

            conversation.user_message_translated = apply_filter(room, 'translate', user_response)
            conversation.assistant_message_translated = "<COT>" + cot + "</COT>" + apply_filter(room, 'translate',
                                                                                                assistant_response)

            session.add(conversation)
            session.commit()
            session.refresh(conversation)

            yield generate_event_stream_message('complete', conversation.model_dump_json())
        except Exception as e:
            logging.exception(e)
            raise e
        finally:
            session.close()

    @room_router.post("/{id}/conversation/{conversation_id}/translate",
                      responses={200: {'model': ConversationsResponse}, 404: {'model': room_not_exist_model}})
    async def translate_conversation(engine: EngineDependency, id: str, conversation_id: str) -> StreamingResponse:
        session = Session(engine)
        try:
            room = get_room_or_404(id, session=session)
            conversation = common.get_or_404(Conversation, session, conversation_id)
        except:
            session.close()
            raise
        if conversation.room_id != room.id:
            raise Exception("Conversation Room ID doesn't match")
        return StreamingResponse(translate_message_streamer(conversation, room, session), headers={
            'Content-Type': 'text/event-stream'
        })

    @room_router.post("/{id}/conversation/apply_first_message")
    async def apply_first_message(session: SessionDependency, argument: SingleTextArgument, id: str):
        room = get_room_or_404(id, session=session)
        if not room.bot.first_message:
            raise Exception("First message not found")
        conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id).order_by(
            Conversation.created_at.desc()).limit(2)).all()

        if len(conversations) != 0:
            if len(conversations) == 2:
                raise Exception("Room already has conversation")

            for conversation in conversations:
                if conversation.user_message:
                    raise Exception("Room already has conversation")
                session.delete(conversation)

        conversation = Conversation()
        conversation.user_message = ''
        cbs = CBSHelper()
        cbs.user = room.persona.name
        cbs.char = room.bot.name
        conversation.assistant_message, _ = parse_prompt(argument.text, cbs)
        conversation.room_id = room.id
        conversation.created_at = datetime.datetime.now()

        session.add(conversation)
        session.commit()
        session.refresh(conversation)

        return conversation.model_dump()

    @room_router.post("/{id}/conversation/re_roll")
    async def re_roll(engine: EngineDependency, argument: ReRollArgument, id: str):
        try:
            session = Session(engine)
            room = get_room_or_404(id, session=session)
            conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id).order_by(
                Conversation.created_at.desc()).limit(1)).all()
            if len(conversations) == 0:
                raise Exception("Conversation not found")

            for conversation in conversations:
                if not conversation.user_message:
                    raise Exception("First message can't be re-rolled")
                message_argument = SendMessageArgument(text=conversation.user_message,
                                                       active_toggles=argument.active_toggles)
                conversation_id = conversation.id
                break
        except:
            session.close()
            raise

        return StreamingResponse(send_message_streamer(message_argument, room, session, conversation_id), headers={
            'Content-Type': 'text/event-stream'
        })

    class SuggestArgument(BaseModel):
        inputs: dict[str, str]

    @room_router.post("/{id}/conversation/suggest")
    async def suggest(session: SessionDependency, id: str, argument: SuggestArgument):
        room = get_room_or_404(id, session=session)
        if not room.suggest_prompt_id:
            raise ClientErrorException(status_code=400, detail='Suggest prompt not found')
        conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id).order_by(
            Conversation.created_at.desc()).limit(1)).all()
        if len(conversations) == 0:
            raise ClientErrorException(status_code=400, detail="There no conversation")
        conversation: Conversation = conversations[0]

        cbs = CBSHelper()
        cbs.user = room.persona.name
        cbs.char = room.bot.name
        cbs.user_prompt = room.persona.prompt
        cbs.char_prompt = room.bot.prompt
        cbs.inputs = argument.inputs
        cbs.content = remove_cot_string(conversation.assistant_message)

        result = await llm_common.perform_prompt(room.suggest_prompt, cbs, session)
        return JSONResponse({"result": result})

    @room_router.post("/{id}/conversation/edit")
    async def edit(session: SessionDependency, id: str, argument: SingleTextArgument):
        room = get_room_or_404(id, session=session)
        conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id).order_by(
            Conversation.created_at.desc()).limit(1)).all()
        if len(conversations) == 0:
            raise Exception("Conversation not found")

        for conversation in conversations:
            if not conversation.user_message:
                raise Exception("First message can't be edited")
            conversation.assistant_message = argument.text
            conversation.assistant_message_translated = ''
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            return conversation.model_dump()

        raise ClientErrorException(status_code=500, detail='Unreachable Code?')

    @room_router.post("/{id}/conversation/revert")
    async def revert(session: SessionDependency, id: str):
        room = get_room_or_404(id, session=session)
        conversations = session.exec(select(Conversation).where(Conversation.room_id == room.id).order_by(
            Conversation.created_at.desc()).limit(1)).all()
        if len(conversations) == 0:
            raise Exception("Conversation not found")

        for conversation in conversations:
            session.delete(conversation)
            summary = session.exec(select(Summary).where(Summary.conversation_id == conversation.id)).one_or_none()
            if summary:
                session.delete(summary)
            session.commit()

        return {"status": "success"}

    class PutTranslateModel(BaseModel):
        user_message_translated: Optional[str] = None
        assistant_message_translated: Optional[str] = None

    @room_router.post('/{id}/conversation/put_translate/{conversation_id}')
    async def put_translate(session: SessionDependency, id: str, conversation_id: str, put: PutTranslateModel):
        conversation = common.get_or_404(Conversation, session, conversation_id)

        if put.user_message_translated is not None:
            conversation.user_message_translated = put.user_message_translated
        if put.assistant_message_translated is not None:
            conversation.assistant_message_translated = put.assistant_message_translated
        session.add(conversation)
        session.commit()
        session.refresh(conversation)
        return conversation.model_dump()
