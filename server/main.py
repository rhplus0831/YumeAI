import asyncio
import random
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from starlette.responses import JSONResponse

from api import room, persona, common, message, image, bot, prompt
from api.bot import BotUpdate, BotGet
from api.common import ClientErrorException
from api.persona import PersonaUpdate
from api.prompt import PromptUpdate
from api.room import RoomUpdate, RoomGet
from database.sql import get_engine
from database.sql_model import Persona, PersonaBase, Room, RoomBase, BotBase, Bot, Prompt, PromptBase

engine = get_engine(create_meta=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield
    engine.dispose()


app = FastAPI(lifespan=lifespan)


# DISABLED
# @app.middleware("http")
async def debugging_delay(request: Request, call_next):
    delay = random.random() * 5
    await asyncio.sleep(delay)
    response = await call_next(request)
    response.headers["X-Debugging-Delay"] = str(delay)
    return response


@app.exception_handler(ClientErrorException)
async def handle_client_error(request: Request, error: ClientErrorException):
    return JSONResponse(status_code=error.status_code, content={"detail": error.detail})


origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

room.engine = engine
room.room_not_exist_model = common.insert_crud(room.router, RoomBase, Room, RoomUpdate, engine,
                                               handle_delete_side_effect=room.room_delete_side_effect,
                                               get_model=RoomGet)

message.engine = engine
message.room_not_exist_model = room.room_not_exist_model
message.register(room.router)

app.include_router(room.router)

persona.engine = engine
persona.persona_not_exist_model = common.insert_crud(persona.router, PersonaBase, Persona, PersonaUpdate, engine)
persona.register()
app.include_router(persona.router)

bot.engine = engine
bot.bot_not_exist_model = common.insert_crud(bot.router, BotBase, Bot, BotUpdate, engine, get_model=BotGet)
bot.register()
app.include_router(bot.router)

image.engine = engine
app.include_router(image.router)

prompt.engine = engine
common.insert_crud(prompt.router, PromptBase, Prompt, PromptUpdate, engine)
app.include_router(prompt.router)
