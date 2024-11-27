from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import Engine

router = APIRouter(prefix="/prompt", tags=["prompt"])
engine: Engine

class PromptUpdate(BaseModel):
    name: str | None = None
    prompt: str | None = None

