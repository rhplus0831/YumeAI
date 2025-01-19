import logging
import os
import uuid

import PIL.Image as PILImage
import aiofiles
from PIL import ImageSequence
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session, select
from starlette.responses import FileResponse

import configure
from api.common import ClientErrorException, EngineDependency, UsernameDependency
from database.sql_model import Image

router = APIRouter(prefix="/image", tags=["image"])


def get_image_and_file_path_or_404(session: Session, user_id: str, file_id: str) -> (Image, str):
    image = session.exec(select(Image).where(Image.file_id == file_id)).one_or_none()
    if image is None:
        raise ClientErrorException(status_code=404, detail="Image not found")
    file_path = os.path.join(configure.get_store_path(f'{user_id}/image'), image.file_id)
    return image, file_path


def generate_new_image(engine, username, content_type):
    os.makedirs(configure.get_store_path(f'{username}/image'), exist_ok=True)
    file_id = uuid.uuid4().hex
    file_path = os.path.join(configure.get_store_path(f'{username}/image'), file_id)

    with Session(engine) as session:
        image = Image(file_id=file_id, file_type=content_type)
        session.add(image)
        session.commit()
        session.refresh(image)

    return image, file_path

@router.post('/')
async def upload_image(engine: EngineDependency, username: UsernameDependency, in_file: UploadFile) -> Image:
    if in_file.size > 20 * 1024 * 1024:
        raise ClientErrorException(status_code=413, detail="File too large")

    os.makedirs(configure.get_store_path(f'{username}/image'), exist_ok=True)
    file_id = uuid.uuid4().hex
    file_path = os.path.join(configure.get_store_path(f'{username}/image'), file_id)

    async with aiofiles.open(file_path, 'wb') as out_file:
        while content := await in_file.read(1024):  # async read chunk
            await out_file.write(content)  # async write chunk

    with Session(engine) as session:
        image = Image(file_id=file_id, file_type=in_file.content_type)
        session.add(image)
        session.commit()
        session.refresh(image)

    return image


@router.get('/{file_id}/{size}')
async def read_image(engine: EngineDependency, username: UsernameDependency, file_id: str, size: str) -> FileResponse:
    with Session(engine) as session:
        image, file_path = get_image_and_file_path_or_404(session, username, file_id)
    if not os.path.exists(file_path):
        raise ClientErrorException(status_code=404, detail="Image file is gone?")

    if size != "original":
        number_size = 100
        if size == "avatar":
            number_size = 100
        if size == "display":
            number_size = 1024

        resized_file_path = file_path + f"_{size}"
        if not os.path.exists(resized_file_path):
            with PILImage.open(file_path) as img:
                if img.format == "GIF":  # GIF 파일 처리
                    frames = []
                    for frame in ImageSequence.Iterator(img):
                        frame = frame.copy()
                        frame.thumbnail((number_size, number_size))  # 비율 유지 크기 조정
                        frames.append(frame)

                    frames[0].save(resized_file_path, format="GIF", save_all=True, append_images=frames[1:])
                else:  # 기타 이미지 형식 처리
                    img.thumbnail((number_size, number_size))  # 비율 유지 크기 조정
                    img.save(resized_file_path, format=img.format)
        return FileResponse(resized_file_path, media_type=image.file_type)

    return FileResponse(file_path, media_type=image.file_type)


class ImageDeleted(BaseModel):
    detail: str = 'Image was deleted'


@router.delete('/{file_id}')
async def delete_image(engine: EngineDependency, username: UsernameDependency, file_id: str) -> ImageDeleted:
    with Session(engine) as session:
        image, file_path = get_image_and_file_path_or_404(session, username, file_id)

    if not os.path.exists(file_path):
        logging.warning("Image file is gone: " + file_path)
    else:
        os.remove(file_path)

    with Session(engine) as session:
        session.delete(image)
        session.commit()

    return ImageDeleted()
