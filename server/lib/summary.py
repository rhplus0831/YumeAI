import datetime

from sqlmodel import Session, select

import configure
from database.sql_model import Conversation, Room, Summary
from lib.llm import llm_common


# TODO: "재 요약본" 보다 더 나은 단어 선택이 필요

async def summarize_conversation(session: Session, conversation: Conversation):
    exist_summary = session.exec(select(Summary).where(Summary.conversation_id == conversation.id)).all()
    # 이미 다른 번역본이 있음 (리롤, 메시지 삭제 후 다른 메시지 전달 등)
    if len(exist_summary) != 0:
        return

    summary_content = (f'{conversation.room.persona.name}: {conversation.user_message}\n'
                       f'{conversation.room.bot.name}: {conversation.assistant_message}')
    summarized = await llm_common.perform_prompt(conversation.room.summary_prompt, {
        "content": lambda: summary_content,
        "user": lambda: conversation.room.persona.name,
        "user_message": lambda: conversation.user_message,
        "char": lambda: conversation.room.bot.name,
        "char_message": lambda: conversation.assistant_message,
    })
    summary = Summary()
    summary.created_at = datetime.datetime.now()
    summary.room_id = conversation.room.id
    summary.conversation_id = conversation.id
    summary.is_top = True
    summary.content = summarized
    session.add(summary)
    session.commit()


async def get_summaries(session: Session, room: Room):
    return session.exec(select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
                        .where(Summary.conversation_id.is_not(None))
                        .order_by(Summary.created_at)).all()


async def get_re_summaries(session: Session, room: Room):
    return session.exec(select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
                        .where(Summary.conversation_id.is_(None))
                        .order_by(Summary.created_at)).all()


async def need_summarize(session: Session, room: Room):
    # 요약이 (대화 최대 + 요약 최대) 를 넘은 상태이면 재요약이 필요함

    return (len(await get_summaries(session, room))
            >= configure.get_max_conversation_count() + configure.get_max_summary_count())


async def summarize(session: Session, room: Room):
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

        combined = await llm_common.perform_prompt(room.re_summary_prompt, {
            "content": lambda: combined,
        })

        parent_summary.content = combined
        session.add(parent_summary)
        session.commit()

    summaries = await get_summaries(session, room)
    # 실제로 들어가지 않는 요약을 잘라냄
    summaries = summaries[:configure.get_max_conversation_count()]
    await internal(summaries)

    re_summaries = await get_re_summaries(session, room)
    if len(re_summaries) >= configure.get_max_re_summary_count():
        await internal(re_summaries)
