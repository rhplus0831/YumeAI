import datetime
from typing import Optional, List

from sqlmodel import SQLModel, Field, Relationship
from sqlmodel import main as _sqlmodel_main

_sqlmodel_main.sa_Enum = lambda _: _sqlmodel_main.AutoString  # type: ignore


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


class Bot(BotBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    firstMessages: List["FirstMessage"] = Relationship(back_populates="bot")


class FirstMessageBase(SQLModel):
    name: str
    prompt: str
    bot_id: int = Field(foreign_key="bot.id")


class FirstMessage(FirstMessageBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    bot: Bot = Relationship(back_populates="firstMessages")


class RoomBase(SQLModel):
    name: str
    bot_id: Optional[int] = Field(foreign_key="bot.id", default=None)
    persona_id: Optional[int] = Field(foreign_key="persona.id", default=None)


class Room(RoomBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    bot: Optional[Bot] = Relationship()
    persona: Optional[Persona] = Relationship()


class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    room_id: int = Field(foreign_key="room.id", index=True)
    room: Room = Relationship()

    created_at: datetime.datetime = Field(default=datetime.datetime.now(), index=True)
    user_message: str
    assistant_message: str


class Image(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_id: str = Field(index=True)
    file_type: str = ''
