import datetime

from sqlmodel import Session, select

import configure
from database.sql_model import Conversation, Room, Summary
from util import interface


# TODO: "재 요약본" 보다 더 나은 단어 선택이 필요

async def summarize_conversation(session: Session, conversation: Conversation):
    summarized = await interface.run_prompt(conversation.room.summary_prompt, {
        "content": lambda: conversation.user_message + '\r\n' + conversation.assistant_message,
    }
                                            , [
                                                {
                                                    'role': 'user',
                                                    'content': conversation.user_message + '\r\n' + conversation.assistant_message,
                                                }
                                            ])
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
                        .where(Summary.parent.is_(None))
                        .order_by(Summary.created_at)).all()


async def get_re_summaries(session: Session, room: Room):
    return session.exec(select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
                        .where(Summary.parent.is_not(None))
                        .order_by(Summary.created_at)).all()


async def get_summaries_and_re(session: Session, room: Room):
    return session.exec(select(Summary).where(Summary.room_id == room.id)
                        .where(Summary.is_top == True)
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

        combined = await interface.run_prompt(room.summary_prompt, {
            "content": lambda: combined,
        }, [
                                                  {
                                                      'role': 'user',
                                                      'content': combined,
                                                  }
                                              ])

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
