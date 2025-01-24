import os
import typing
from io import BytesIO

from starlette.responses import RedirectResponse, FileResponse

import configure
from api.common import ClientErrorException


def safe_remove(path):
    try:
        os.remove(path)
    except:
        pass


def put_file(src: str | bytes | typing.BinaryIO, dest_path: str):
    if configure.use_s3_for_store():
        client = configure.get_s3_client()
        if isinstance(src, str):
            client.upload_file(src, configure.get_s3_bucket(), dest_path)
        else:
            if isinstance(src, bytes):
                src = BytesIO(src)
                src.seek(0)
            client.upload_fileobj(src, configure.get_s3_bucket(), dest_path)
    else:
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


def delete_file(path: str):
    if configure.use_s3_for_store():
        client = configure.get_s3_client()
        client.delete_object(Bucket=configure.get_s3_bucket(), Key=path)
    else:
        safe_remove(configure.get_store_path(path))


def locate_file(path: str):
    if configure.use_s3_for_store():
        return configure.get_cdn_address() + path
    return configure.get_store_path(path)


def response_file(path: str, type: str):
    if configure.use_s3_for_store():
        return RedirectResponse(configure.get_cdn_address() + path, headers={
            'X-Content-Type': type
        })

    if not os.path.exists(configure.get_store_path(path)):
        return ClientErrorException(status_code=404, detail="File not found")

    return FileResponse(configure.get_store_path(path), media_type=type)
