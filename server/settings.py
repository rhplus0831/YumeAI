from sqlmodel import Session, select

from database.sql import sql_exec
from database.sql_model import GlobalSetting


def get_setting_with_key(session: Session, key: str, default=None):
    global_key = sql_exec(session, select(GlobalSetting).where(GlobalSetting.key == key)).one_or_none()
    if global_key and global_key.value:
        return global_key.value
    return default


def get_max_re_summary_count(session: Session):
    return int( get_setting_with_key(session, 'max_re_summary_count', 3) )


def get_max_summary_count(session: Session):
    return int( get_setting_with_key(session, 'max_summary_count', 3) )


def get_max_conversation_count(session: Session):
    return int( get_setting_with_key(session, 'max_conversation_count', 3) )


def get_openai_api_key(session: Session):
    return get_setting_with_key(session, 'openai_api_key')


def get_gemini_api_key(session: Session):
    return get_setting_with_key(session, 'gemini_api_key')
