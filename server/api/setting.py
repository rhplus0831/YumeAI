from fastapi import APIRouter
from sqlmodel import select
from starlette.responses import JSONResponse

from api.common import SessionDependency
from database.sql_model import GlobalSetting

router = APIRouter(prefix="/settings", tags=["Setting"])


def register():
    @router.get("/")
    def get_settings(session: SessionDependency):
        result = {}
        for setting in session.exec(select(GlobalSetting)):
            result[setting.key] = setting.value

        return JSONResponse(content=result)

    @router.put("/{key}/{value}")
    def put_setting(session: SessionDependency, key: str, value: str):
        session.exec(select(GlobalSetting).where(GlobalSetting.key == key)).update({GlobalSetting.value: value})
        session.commit()

    @router.put("/")
    def put_settings(session: SessionDependency, settings: dict):
        for key, value in settings.items():
            session.exec(select(GlobalSetting).where(GlobalSetting.key == key)).update({GlobalSetting.value: value})
        session.commit()