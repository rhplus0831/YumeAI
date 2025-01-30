from typing import Sequence, Optional

from fastapi import APIRouter
from fastapi.params import Query
from pydantic import BaseModel
from sqlmodel import select
from starlette.responses import JSONResponse

from api import common
from api.common import SessionDependency, RequestDependency
from database.sql_model import PromptBase, Prompt, Room
from lib.cbs import CBSHelper
from lib.llm import llm_common
from lib.prompt import lint_chat, lint_summary, lint_content_only, parse_prompt

router = APIRouter(prefix="/prompt", tags=["prompt"])


class PromptUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None
    type: str | None = None

    llm: str | None = None
    llm_config: str | None = None
    use_stream: bool | None = None

    filters: str | None = None
    toggles: str | None = None


common.validate_update_model(PromptBase, PromptUpdate)


def register():
    @router.get("")
    def gets_with_filter(session: SessionDependency, type: str = Query(default="all"), offset: int = Query(default=0),
                         limit: int = Query(default=100, le=100)) -> Sequence[
        Prompt]:
        if type == 'all':
            prompts = session.exec(
                select(Prompt).offset(offset).limit(limit)
            ).all()
        else:
            prompts = session.exec(
                select(Prompt).where(Prompt.type == type.replace("_", "-")).offset(offset).limit(limit)
            ).all()
        return prompts

    @router.post("/{id}/lint", response_model=PromptUpdate)
    def lint(session: SessionDependency, id: str):
        prompt = common.get_or_404(Prompt, session, id)

        result = []

        if prompt.type == 'chat':
            result = lint_chat(prompt)
        elif prompt.type == 'summary':
            result = lint_summary(prompt)
        elif prompt.type == 're-summary' or prompt.type == 'translate' or prompt.type == 'suggest':
            result = lint_content_only(prompt)

        result = list(set(result))

        if len(result) == 0:
            return JSONResponse(content={
                'check': 'ok',
                'message': '확인된 문제가 없습니다.',
            }, status_code=200)

        return JSONResponse(content={
            'check': 'fail',
            'message': result
        }, status_code=200)

    class PromptTestInfoModel(BaseModel):
        active_toggles: str

    @router.post("/{id}/test", response_model=PromptUpdate)
    def test(session: SessionDependency, info: PromptTestInfoModel, id: str):
        prompt: Prompt = common.get_or_404(Prompt, session, id)

        cbs = CBSHelper()
        cbs.user = '!!User!!'
        cbs.user_prompt = '!!User Prompt!!'
        cbs.char = '!!Char!!'
        cbs.char_prompt = '!!Char Prompt!!'
        cbs.summaries = '!!Summary!!'
        cbs.re_summaries = '!!Re Summary!!'
        cbs.conversations = '!!Conversations!!'
        cbs.messages = '!!Messages!!'
        cbs.message_count = 39
        cbs.content = '!!Content!!'
        cbs.user_content = '!!User Message!!'
        cbs.char_message = '!!Char Message!!'
        cbs.parsed_lore_book = '!!Lore Book!!'

        cbs.conversations = '||user||\nHello?\n||assistant||\nHi!'
        cbs.message = 'How have you been?'
        cbs.chat = cbs.conversations + '\n||user||' + cbs.message

        if info.active_toggles:
            for active_toggle in info.active_toggles.split(','):
                cbs.global_vars[f"toggle_{active_toggle}"] = '1'

        return JSONResponse(content={
            'message': parse_prompt(prompt.prompt, cbs)
        })

    class TranslateArgumentModal(BaseModel):
        room_id: Optional[str] = None
        text: str

    @router.post("/{id}/perform_translate")
    async def perform_translate_prompt(argument: TranslateArgumentModal, wrapper: RequestDependency, id: str):
        session = wrapper.session
        prompt: Prompt = common.get_or_404(Prompt, session, id)
        cbs = CBSHelper()
        cbs.content = ''.join(argument.text)
        if argument.room_id:
            room: Room = common.get_or_404(Room, session, argument.room_id)
            cbs.put_data_with_room(room)
            wrapper.register_room_id(room.id)

        wrapper.register_title('번역 작업')
        result = await llm_common.perform_prompt(prompt, cbs, wrapper)
        return {
            "result": result,
        }
