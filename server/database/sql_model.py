import datetime
from typing import Optional

from sqlalchemy import Enum
from sqlmodel import SQLModel, Field, Relationship
from sqlmodel import main as _sqlmodel_main

_sqlmodel_main.sa_Enum = lambda _: _sqlmodel_main.AutoString  # type: ignore


# TODO: CombineIt to this_format


class PersonaBase(SQLModel):
    name: str
    displayName: str
    profileImageId: Optional[str] = None
    prompt: str


class Persona(PersonaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class BotBase(SQLModel):
    name: str
    displayName: str
    profileImageId: Optional[str] = None
    prompt: str
    first_message: Optional[str] = None

    filters: Optional[str] = Field(default=None)

    image_assets: Optional[str] = Field(default=None)


class Bot(BotBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class LLMModel(Enum):
    OPENAI = "openai"
    GEMINI = "gemini"


class PromptBase(SQLModel):
    name: str
    prompt: str

    # pydantic.errors.PydanticUserError: `model_config` cannot be used as a model field name. Use `model_config` for model configuration.
    llm: str
    llm_config: str  # Store as Json

    use_stream: Optional[bool] = Field(default=False)

    type: str = Field(index=True)

    filters: Optional[str] = Field(default=None)
    toggles: Optional[str] = Field(default=None)


class Prompt(PromptBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class RoomBase(SQLModel):
    name: str
    bot_id: Optional[int] = Field(foreign_key="bot.id", default=None)
    persona_id: Optional[int] = Field(foreign_key="persona.id", default=None)

    prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
    summary_prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
    re_summary_prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")

    translate_method: Optional[str] = Field(default=None)
    translate_prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
    translate_only_assistant: bool = Field(default=False)

    filters: Optional[str] = Field(default=None)

    last_message_time: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now)


class Room(RoomBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    bot: Optional[Bot] = Relationship()
    persona: Optional[Persona] = Relationship()

    prompt: Optional[Prompt] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Room.prompt_id]"})
    summary_prompt: Optional[Prompt] = Relationship(sa_relationship_kwargs={"foreign_keys": "[Room.summary_prompt_id]"})
    re_summary_prompt: Optional[Prompt] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Room.re_summary_prompt_id]"})

    translate_prompt: Optional[Prompt] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Room.translate_prompt_id]"})


class ConversationBase(SQLModel):
    room_id: int = Field(foreign_key="room.id", index=True)

    created_at: datetime.datetime = Field(default=datetime.datetime.now(), index=True)
    user_message: str
    assistant_message: str

    user_message_translated: Optional[str] = Field(default=None)
    assistant_message_translated: Optional[str] = Field(default=None)


class Conversation(ConversationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    room: Room = Relationship()


class SummaryBase(SQLModel):
    room_id: int = Field(foreign_key="room.id", index=True)
    created_at: datetime.datetime = Field(default=datetime.datetime.now(), index=True)

    conversation_id: int = Field(foreign_key="conversation.id", default=None, nullable=True, index=True)
    parent: int = Field(foreign_key="summary.id", default=None, nullable=True, index=True)

    content: str
    # 미래에 사용할 가능성?
    keyword: str = Field(nullable=True, default=None)

    # 최상위 요약인지의 여부입니다.
    # 요약 시스템은 대화를 요약하고, 필요한경우 요약을 요약하기 때문에
    # 이 요약이 최상위 요약인지의 여부를 빠르게 판단하기 위해 사용합니다.
    is_top: bool = Field(index=True)


class Summary(SummaryBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)


class Image(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_id: str = Field(index=True)
    file_type: str = ''
