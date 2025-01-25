import os
import typing

from starlette.responses import FileResponse, Response

import configure
from api.common import ClientErrorException
from delayed.tasks import remove_file, upload_to_s3


def safe_remove(path):
    try:
        os.remove(path)
    except:
        pass


def put_file(src: str | bytes | typing.BinaryIO, dest_path: str):
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

    if configure.use_s3_for_store():
        upload_to_s3.queue_task(local_path, dest_path)


def delete_file(path: str):
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
