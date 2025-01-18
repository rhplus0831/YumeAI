import json
import os
import uuid
from contextlib import asynccontextmanager
from typing import Annotated
from zipfile import ZipFile

import aiofiles
from fastapi import FastAPI, Request, BackgroundTasks, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Depends
from openai import BaseModel
from sqlmodel import SQLModel, Session
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, FileResponse

import configure
from api import room, persona, common, image, bot, prompt, conversation
from api.bot import BotUpdate, BotGet
from api.common import ClientErrorException, UsernameDependency, SessionDependency
from api.persona import PersonaUpdate
from api.prompt import PromptUpdate
from api.room import RoomUpdate, RoomGet
from database.sql import get_engine
from database.sql_model import Persona, PersonaBase, Room, RoomBase, BotBase, Bot, Prompt, PromptBase
from lib.auth import check_id_valid

app = FastAPI()


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

passwords = {}
engines = {}


def get_password(username: str):
    if username in passwords:
        password = passwords[username]
    else:
        path = configure.get_fast_store_path(f"{username}/password")
        if not os.path.exists(path):
            return 'INVALID'
        with open(path, "r") as f:
            password = f.read()
            passwords[username] = password

    return password


def get_register_allowed():
    return os.getenv("ALLOW_REGISTER") == "true" or os.getenv("ALLOW_REGISTER") == "True"


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

        password = get_password(auth_id)
        if auth_token != password:
            return JSONResponse(status_code=401, content={"detail": invalid_string})

        request.state.username = auth_id

        if auth_id in engines:
            request.state.db = engines[auth_id]
        else:
            engine = get_engine(configure.get_fast_store_path(f"{auth_id}/yumeAI.db"))
            engines[auth_id] = engine
            request.state.db = engine

        response = await call_next(request)
        return response


app.add_middleware(AuthorizationMiddleware)

room.room_not_exist_model = common.insert_crud(room.router, RoomBase, Room, RoomUpdate,
                                               handle_delete_side_effect=room.room_delete_side_effect,
                                               get_model=RoomGet, skip_get_list=True)
room.register()

conversation.room_not_exist_model = room.room_not_exist_model
conversation.register(room.router)

app.include_router(room.router)

persona.persona_not_exist_model = common.insert_crud(persona.router, PersonaBase, Persona, PersonaUpdate)
persona.register()
app.include_router(persona.router)

bot.bot_not_exist_model = common.insert_crud(bot.router, BotBase, Bot, BotUpdate, get_model=BotGet)
bot.register()
app.include_router(bot.router)

app.include_router(image.router)

common.insert_crud(prompt.router, PromptBase, Prompt, PromptUpdate, skip_get_list=True)
prompt.register()
app.include_router(prompt.router)


class LoginData(BaseModel):
    username: str
    password: str  # sha512


@app.get("/verify-self")
def verify_self(request: Request):
    return JSONResponse(content={}, status_code=200)


@app.post("/login")
def login(data: LoginData):
    password = get_password(data.username)
    if data.password != password:
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

    path = configure.get_fast_store_path(f"{data.username}/password")
    if os.path.exists(path):
        raise ClientErrorException(status_code=409, detail="Username already exists")

    os.makedirs(configure.get_fast_store_path(f"{data.username}"), exist_ok=True)
    os.makedirs(configure.get_store_path(f"{data.username}"), exist_ok=True)

    with open(path, "w") as f:
        f.write(data.password)

    response = JSONResponse({"status": "ok"})
    response.set_cookie(key="auth_id", value=data.username, httponly=True)
    response.set_cookie(key="auth_token", value=data.password, httponly=True)
    return response


@app.post("/import")
async def import_data(in_file: UploadFile, session: SessionDependency, username: UsernameDependency):
    path = configure.get_store_path(f'{username}/import_{uuid.uuid4().hex}.zip')
    try:
        async with aiofiles.open(path, 'wb') as out_file:
            while content := await in_file.read(1024):  # async read chunk
                await out_file.write(content)  # async write chunk

        from lib.backup.importer import import_zip_file
        await import_zip_file(session, username, path)
        return JSONResponse({"status": "ok"})
    finally:
        os.remove(path)


@app.get("/exported/{id}")
def download_exported(id: str, username: UsernameDependency, background_tasks: BackgroundTasks):
    path = configure.get_store_path(f"{username}/export/{id}.zip")
    if not os.path.exists(path):
        raise ClientErrorException(status_code=404, detail="Exported file is gone")

    def delete_file(file_path: str):
        os.remove(file_path)

    background_tasks.add_task(delete_file, path)
    return FileResponse(path, media_type="application/zip")
