import logging
import os
import uuid

import aiofiles
from cachetools import TTLCache
from fastapi import FastAPI, Request, BackgroundTasks, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, FileResponse

import configure
from api import room, persona, common, image, bot, prompt, conversation, setting
from api.bot import BotUpdate, BotGet, bot_delete_side_effect
from api.common import ClientErrorException, UsernameDependency, SessionDependency
from api.persona import PersonaUpdate, persona_delete_side_effect
from api.prompt import PromptUpdate
from api.room import RoomUpdate, RoomGet
from database.sql import get_engine
from database.sql_model import Persona, PersonaBase, Room, RoomBase, BotBase, Bot, Prompt, PromptBase
from lib.auth import check_id_valid, check_pw_valid

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


app.add_middleware(AuthorizationMiddleware)

room.room_not_exist_model = common.insert_crud(room.router, RoomBase, Room, RoomUpdate,
                                               handle_delete_side_effect=room.room_delete_side_effect,
                                               get_model=RoomGet, skip_get_list=True)
room.register()

conversation.room_not_exist_model = room.room_not_exist_model
conversation.register(room.router)

app.include_router(room.router)

persona.persona_not_exist_model = common.insert_crud(persona.router, PersonaBase, Persona, PersonaUpdate, handle_delete_side_effect=persona.persona_delete_side_effect)
persona.register()
app.include_router(persona.router)

bot.bot_not_exist_model = common.insert_crud(bot.router, BotBase, Bot, BotUpdate, get_model=BotGet, handle_delete_side_effect=bot.bot_delete_side_effect)
bot.register()
app.include_router(bot.router)

app.include_router(image.router)

common.insert_crud(prompt.router, PromptBase, Prompt, PromptUpdate, skip_get_list=True)
prompt.register()
app.include_router(prompt.router)

setting.register()
app.include_router(setting.router)


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
