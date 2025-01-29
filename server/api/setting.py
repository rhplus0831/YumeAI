import datetime

from fastapi import APIRouter
from sqlmodel import select
from starlette.responses import JSONResponse

from api.common import SessionDependency
from database.sql_model import GlobalSetting
from lib.storage import get_total_storage_size

router = APIRouter(prefix="/settings", tags=["Setting"])


def register():
    @router.get("")
    def get_settings(session: SessionDependency):
        result = {}
        for setting in session.exec(select(GlobalSetting)):
            result[setting.key] = setting.value

        result['storage_usage'] = f"{round(get_total_storage_size(session) / 1024 / 1024, 3)}MB"

        return JSONResponse(content=result)

    @router.put("")
    def put_settings(session: SessionDependency, settings: dict):
        for key, value in settings.items():
            data = session.exec(select(GlobalSetting).where(GlobalSetting.key == key)).one_or_none()
            if data:
                data.value = value
                data.updated_at = datetime.datetime.now()
            else:
                data = GlobalSetting(key=key, value=value)
            session.add(data)

        session.commit()
