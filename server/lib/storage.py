import os
import typing

from sqlalchemy import func
from sqlmodel import Session, select
from starlette.responses import FileResponse, Response

import configure
from api.common import ClientErrorException
from database.sql import sql_exec
from database.sql_model import StorageFile
from delayed.tasks import remove_file, upload_to_s3


def safe_remove(path):
    try:
        os.remove(path)
    except:
        pass


def get_total_storage_size(session: Session) -> int:
    # SQLAlchemy를 통해 총 size 합을 구하기
    result = sql_exec(session, select(func.sum(StorageFile.size)))

    total_size = result.one_or_none()
    return total_size if total_size else 0


def put_file(session: Session, src: str | bytes | typing.BinaryIO, dest_path: str):
    if configure.get_storage_limit() != -1:
        total_size = get_total_storage_size(session)
        if total_size > configure.get_storage_limit():
            raise ClientErrorException(status_code=400, detail="Storage limit exceeded")

    local_path = configure.get_store_path(dest_path)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    # TODO: Buffering

    if isinstance(src, str):
        with open(src, 'rb') as f:
            data = f.read()
    elif isinstance(src, bytes):
        data = src
    else:
        data = src.read()

    with open(local_path, 'wb') as f:
        f.write(data)

    sf = StorageFile(path=dest_path, size=len(data))
    session.add(sf)
    session.commit()

    if configure.use_s3_for_store():
        upload_to_s3.queue_task(local_path, dest_path)


def delete_file(session: Session, path: str):
    sf = sql_exec(session, select(StorageFile).where(StorageFile.path == path)).one_or_none()
    if sf is not None:
        session.delete(sf)
        session.commit()
    remove_file.queue_task(path)


def locate_file(path: str):
    local_path = configure.get_store_path(path)
    if os.path.exists(local_path):
        return local_path

    if configure.use_s3_for_store():
        return configure.get_cdn_address() + path

    # TODO: Warning or Error?
    return local_path


def response_file(path: str, type: str):
    if os.path.exists(configure.get_store_path(path)):
        return FileResponse(configure.get_store_path(path), media_type=type)

    if configure.use_s3_for_store():
        return Response(status_code=204, headers={
            'x-data-location': configure.get_cdn_address() + path,
            'x-content-type': type
        })
    else:
        return ClientErrorException(status_code=404, detail="File not found")
