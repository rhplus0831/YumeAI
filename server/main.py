import logging
import os
import threading
from contextlib import asynccontextmanager

from cachetools import TTLCache
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import BaseModel
from sqlalchemy import delete
from sqlmodel import SQLModel
from sqlmodel import select
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

import configure
import delayed.processor
from api import room, persona, common, image, bot, prompt, conversation, setting, summary, lore
from api.bot import BotUpdate, BotGet
from api.common import ClientErrorException, UsernameDependency, SessionDependency
from api.persona import PersonaUpdate
from api.prompt import PromptUpdate
from api.room import RoomUpdate, RoomGet
from database.sql import get_engine
from database.sql_model import Persona, PersonaBase, Room, RoomBase, BotBase, Bot, Prompt, PromptBase, Image
from lib.auth import check_id_valid, check_pw_valid
from lib.storage import delete_file


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Using Storage Limit: {configure.get_storage_limit()}")
    thread = threading.Thread(target=delayed.processor.main)
    thread.start()
    yield


app = FastAPI(lifespan=lifespan)


@app.exception_handler(StarletteHTTPException)
async def custom_404_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail}
    )


@app.exception_handler(Exception)
async def handle_client_error(request: Request, error: Exception):
    if isinstance(error, ClientErrorException):
        return JSONResponse(status_code=error.status_code, content={"status": "error", "detail": error.detail})
    return JSONResponse(status_code=500, content={"status": "error", "detail": str(error)})


origins = [
    "http://localhost:831",
]

app.add_middleware(CORSMiddleware,  # type: ignore
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache: TTLCache = TTLCache(maxsize=3000, ttl=1800)


class LoginCache:
    def __init__(self):
        self.password = None
        self.engine = None


def get_register_allowed():
    if os.getenv("ALLOW_REGISTER") is None:
        return False
    return os.getenv("ALLOW_REGISTER").lower() == "true"


def do_login(auth_id, auth_token):
    if not configure.use_encrypted_db():
        check_path = configure.get_fast_store_path(f"{auth_id}/password")
        with open(check_path, "r") as f:
            check = f.read()

        if check != auth_token:
            raise ClientErrorException(status_code=401, detail="Credentials is missing or invalid")

    login_data = LoginCache()
    login_data.password = auth_token
    login_data.engine = get_engine(configure.get_fast_store_path(f"{auth_id}/yumeAI.db"), auth_token)
    cache[auth_id] = login_data

    return login_data


class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        invalid_string = "Credentials is missing or invalid"

        if request.url.path.startswith("/docs") or request.url.path.startswith("/openapi.json"):
            return await call_next(request)

        if request.url.path == '/register' or request.url.path == '/login' or request.url.path == '/check-register-available':
            return await call_next(request)

        auth_id = request.cookies.get("auth_id")
        auth_token = request.cookies.get("auth_token")

        if not auth_id or not auth_token:
            return JSONResponse(status_code=401, content={"detail": invalid_string})

        if not check_id_valid(auth_id):
            return JSONResponse(status_code=401, content={"detail": invalid_string})

        if not check_pw_valid(auth_token):
            return JSONResponse(status_code=401, content={"detail": invalid_string})

        if auth_id in cache:
            login_data = cache[auth_id]
            if cache[auth_id].password != auth_token:
                return JSONResponse(status_code=401, content={"detail": invalid_string})
        else:
            login_data = do_login(auth_id, auth_token)

        request.state.username = auth_id
        request.state.db = login_data.engine

        response = await call_next(request)
        return response


app.add_middleware(AuthorizationMiddleware)  # type: ignore

room.room_not_exist_model = common.insert_crud(room.router, RoomBase, Room, RoomUpdate,
                                               handle_delete_side_effect=room.room_delete_side_effect,
                                               get_model=RoomGet, skip_get_list=True)
room.register()

conversation.room_not_exist_model = room.room_not_exist_model
conversation.register(room.router, app)

summary.register(room.router, app)

# summary restore on conversation (temp)

app.include_router(room.router)

persona.persona_not_exist_model = common.insert_crud(persona.router, PersonaBase, Persona, PersonaUpdate,
                                                     handle_delete_side_effect=persona.persona_delete_side_effect)
persona.register()
app.include_router(persona.router)

bot.bot_not_exist_model = common.insert_crud(bot.router, BotBase, Bot, BotUpdate, get_model=BotGet,
                                             handle_delete_side_effect=bot.bot_delete_side_effect)
bot.register()
app.include_router(bot.router)

app.include_router(image.router)

common.insert_crud(prompt.router, PromptBase, Prompt, PromptUpdate, skip_get_list=True)
prompt.register()
app.include_router(prompt.router)

setting.register()
app.include_router(setting.router)

lore.register()
app.include_router(lore.router)


class LoginData(BaseModel):
    username: str
    password: str  # sha512


@app.get("/verify-self")
def verify_self(request: Request):
    return JSONResponse(content={}, status_code=200)


@app.post("/login")
def login(data: LoginData):
    try:
        login_cache = do_login(data.username, data.password)
    except Exception as e:
        logging.exception(e)
        raise ClientErrorException(status_code=401, detail="Invalid credentials")
    response = JSONResponse({"status": "ok"})
    response.set_cookie(key="auth_id", value=data.username, httponly=True)
    response.set_cookie(key="auth_token", value=data.password, httponly=True)
    return response


@app.get("/check-register-available")
def check_register_available():
    if not get_register_allowed():
        raise ClientErrorException(status_code=403, detail="Register is not allowed")
    return JSONResponse(content={}, status_code=200)


@app.post("/register")
def register(data: LoginData):
    if not get_register_allowed():
        raise ClientErrorException(status_code=403, detail="Register is not allowed")

    if not check_id_valid(data.username):
        raise ClientErrorException(status_code=400, detail="Username is invalid")

    if not check_pw_valid(data.password):
        raise ClientErrorException(status_code=400, detail="Password is invalid")

    path = configure.get_fast_store_path(f"{data.username}/yumeAI.db")
    if os.path.exists(path):
        raise ClientErrorException(status_code=409, detail="Username already exists")

    os.makedirs(configure.get_fast_store_path(f"{data.username}"), exist_ok=True)
    os.makedirs(configure.get_store_path(f"{data.username}"), exist_ok=True)

    if not configure.use_encrypted_db():
        with open(configure.get_fast_store_path(f"{data.username}/password"), "w") as f:
            f.write(data.password)

    response = JSONResponse({"status": "ok"})
    response.set_cookie(key="auth_id", value=data.username, httponly=True)
    response.set_cookie(key="auth_token", value=data.password, httponly=True)
    return response


@app.post("/clear-all")
def clear_all(username: UsernameDependency, session: SessionDependency):
    for i in session.exec(select(Image)):
        delete_file(session, image.get_file_path(username, i.id))

    # Clear all sqlmodel tables from session
    for table in reversed(SQLModel.metadata.sorted_tables):
        session.execute(delete(table))

    session.commit()
    return True
