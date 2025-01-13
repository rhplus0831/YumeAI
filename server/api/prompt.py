from typing import Sequence

from fastapi import APIRouter
from fastapi.params import Query
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import JSONResponse

from api import common
from database.sql_model import PromptBase, Prompt
from lib.prompt import lint_chat, lint_summary, lint_content_only

router = APIRouter(prefix="/prompt", tags=["prompt"])
engine: Engine


class PromptUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None
    type: str | None = None

    llm: str | None = None
    llm_config: str | None = None

    filters: str | None = None


common.validate_update_model(PromptBase, PromptUpdate)


def register():
    @router.get("/")
    def gets_with_filter(type: str = "all", offset: int = 0, limit: int = Query(default=100, le=100)) -> Sequence[
        Prompt]:
        with Session(engine) as session:
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
    def lint(id: int):
        with Session(engine) as session:
            prompt = common.get_or_404(Prompt, session, id)

        result = []

        if prompt.type == 'chat':
            result = lint_chat(prompt)
        elif prompt.type == 'summary':
            result = lint_summary(prompt)
        elif prompt.type == 're-summary' or prompt.type == 'translate':
            result = lint_content_only(prompt)

        if len(result) == 0:
            return JSONResponse(content={
                'check': 'ok',
                'message': '확인된 문제가 없습니다.',
            }, status_code=200)

        return JSONResponse(content={
            'check': 'fail',
            'message': result
        }, status_code=200)
