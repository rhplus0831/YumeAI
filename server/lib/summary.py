import datetime

from sqlmodel import Session, select

import settings
from api.common import RequestWrapper
from database.sql import sql_exec
from database.sql_model import Conversation, Room, Summary
from lib.cbs import CBSHelper
from lib.filter import remove_cot_string
from lib.llm import llm_common


# TODO: "재 요약본" 보다 더 나은 단어 선택이 필요

async def summarize_conversation(wrapper: RequestWrapper, conversation: Conversation,
                                 overwrite_to: Summary | None = None):
    session = wrapper.session
    if not overwrite_to:
        exist_summary = sql_exec(session, select(Summary).where(Summary.conversation_id == conversation.id)).all()
        # 이미 다른 요약본이 있음 (리롤, 메시지 삭제 후 다른 메시지 전달 등)
        if len(exist_summary) != 0:
            wrapper.log("이전 메시지의 요약본이 이미 있습니다, 요약을 수행하지 않습니다", True)
            return

    summary_content = (f'{conversation.room.persona.name}: {conversation.user_message}\n'
                       f'{conversation.room.bot.name}: {remove_cot_string(conversation.assistant_message)}')
    cbs = CBSHelper()
    cbs.content = summary_content
    cbs.user = conversation.room.persona.name
    cbs.user_prompt = conversation.room.persona.prompt
    cbs.user_message = conversation.user_message
    cbs.char = conversation.room.bot.name
    cbs.char_prompt = conversation.room.bot.prompt
    cbs.char_message = conversation.assistant_message

    wrapper.log('이전 대화 요약', True)
    summarized = await llm_common.perform_prompt(conversation.room.summary_prompt, cbs, wrapper)
    if overwrite_to:
        overwrite_to.content = summarized
        session.add(overwrite_to)
        session.commit()
        session.refresh(overwrite_to)
        return overwrite_to
    else:
        summary = Summary()
        summary.created_at = datetime.datetime.now()
        summary.room_id = conversation.room.id
        summary.conversation_id = conversation.id
        summary.is_top = True
        summary.content = summarized
        session.add(summary)
        session.commit()


async def get_summaries(session: Session, room: Room):
    return sql_exec(session, select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
                        .where(Summary.conversation_id.is_not(None))
                        .order_by(Summary.created_at)).all()


async def get_re_summaries(session: Session, room: Room):
    return sql_exec(session, select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
                        .where(Summary.conversation_id.is_(None))
                        .order_by(Summary.created_at)).all()


async def need_summarize(session: Session, room: Room):
    # 요약이 (대화 최대 + 요약 최대) 를 넘은 상태이면 재요약이 필요함

    return (len(await get_summaries(session, room))
            >= settings.get_max_conversation_count(session) + settings.get_max_summary_count(session))


async def summarize(wrapper: RequestWrapper, room: Room):
    session = wrapper.session
    async def internal(summaries: list):
        # 요약을 묶을 요약을 빈 상태로 만들어 id를 발급
        parent_summary = Summary()
        parent_summary.room_id = room.id
        parent_summary.is_top = True
        parent_summary.content = ''
        parent_summary.created_at = datetime.datetime.now()
        session.add(parent_summary)
        session.commit()
        session.refresh(parent_summary)

        combined = ''

        for summary in summaries:
            combined += summary.content + '\r\n'
            summary.is_top = False
            summary.parent = parent_summary.id
            session.add(summary)

        session.commit()

        combined = combined.rstrip('\r\n')
        cbs = CBSHelper()
        cbs.content = combined
        combined = await llm_common.perform_prompt(room.re_summary_prompt, cbs, wrapper)

        parent_summary.content = combined
        session.add(parent_summary)
        session.commit()

    summaries = await get_summaries(session, room)
    # 실제로 들어가지 않는 요약을 잘라냄
    summaries = summaries[:settings.get_max_conversation_count(session)]
    wrapper.log('쌓인 요약을 재 요약', True)
    await internal(summaries)

    re_summaries = await get_re_summaries(session, room)
    if len(re_summaries) >= settings.get_max_re_summary_count(session):
        wrapper.log('쌓인 재 요약을 하나로 요약', True)
        await internal(re_summaries)
