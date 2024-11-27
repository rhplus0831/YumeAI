import logging
import os
import uuid

import aiofiles
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session, select
from starlette.responses import FileResponse

import configure
from api.common import ClientErrorException
from database.sql_model import Image

router = APIRouter(prefix="/image", tags=["image"])
engine: Engine


async def get_image_and_file_path_or_404(session: Session, file_id: str) -> (Image, str):
    image = session.exec(select(Image).where(Image.file_id == file_id)).one_or_none()
    if image is None:
        raise ClientErrorException(status_code=404, detail="Image not found")
    file_path = os.path.join(configure.get_store_path('image'), image.file_id)
    return image, file_path


@router.post('/')
async def upload_image(in_file: UploadFile) -> Image:
    if in_file.size > 10 * 1024 * 1024:
        raise ClientErrorException(status_code=413, detail="File too large")

    os.makedirs(configure.get_store_path('image'), exist_ok=True)
    file_id = uuid.uuid4().hex
    file_path = os.path.join(configure.get_store_path('image'), file_id)

    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await in_file.read(1024):  # async read chunk
            await out_file.write(content)  # async write chunk

    with Session(engine) as session:
        image = Image(file_id=file_id, file_type=in_file.content_type)
        session.add(image)
        session.commit()
        session.refresh(image)

    return image


@router.get('/{file_id}')
async def read_image(file_id: str) -> FileResponse:
    with Session(engine) as session:
        image, file_path = await get_image_and_file_path_or_404(session, file_id)
    if not os.path.exists(file_path):
        raise ClientErrorException(status_code=404, detail="Image file is gone?")

    return FileResponse(file_path, media_type=image.file_type)


class ImageDeleted(BaseModel):
    detail: str = 'Image was deleted'


@router.delete('/')
async def delete_image(file_id: str) -> ImageDeleted:
    with Session(engine) as session:
        image, file_path = await get_image_and_file_path_or_404(session, file_id)

    if not os.path.exists(file_path):
        logging.warning("Image file is gone: " + file_path)
    else:
        os.remove(file_path)

    with Session(engine) as session:
        session.delete(image)
        session.commit()

    return ImageDeleted()
