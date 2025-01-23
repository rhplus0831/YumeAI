import asyncio
import mimetypes
import os
import uuid

import PIL.Image as PILImage
from PIL import ImageSequence
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session, select

import configure
from api.common import ClientErrorException, UsernameDependency, SessionDependency
from database.sql_model import Image
from lib.storage import response_file, delete_file, safe_remove, put_file

router = APIRouter(prefix="/image", tags=["image"])


def get_file_path(user_id: str, file_id: str) -> str:
    return f'{user_id}/image/{file_id}'


def get_image_and_file_path_or_404(session: Session, user_id: str, file_id: str) -> (Image, str):
    image = session.exec(select(Image).where(Image.file_id == file_id)).one_or_none()
    if image is None:
        raise ClientErrorException(status_code=404, detail="Image not found")

    return image, get_file_path(user_id, file_id)


def generate_new_image(session, username, content_type):
    file_id = uuid.uuid4().hex
    file_path = get_file_path(username, file_id)

    image = Image(file_id=file_id, file_type=content_type)
    session.add(image)
    session.commit()
    session.refresh(image)

    return image, file_path


known_resize_variant = ['avatar', 'display']


async def resize_file(src: str, dest: str, variant: str):
    number_size = 100
    if variant == "avatar":
        number_size = 100
    if variant == "display":
        number_size = 1024

    with PILImage.open(src) as img:
        if img.format == "GIF":  # GIF 파일 처리
            frames = []
            for frame in ImageSequence.Iterator(img):
                frame = frame.copy()
                frame.thumbnail((number_size, number_size))  # 비율 유지 크기 조정
                frames.append(frame)

            frames[0].save(dest, format="GIF", save_all=True, append_images=frames[1:])
        else:  # 기타 이미지 형식 처리
            img.thumbnail((number_size, number_size))  # 비율 유지 크기 조정
            img.save(dest, format=img.format)


@router.post('/')
async def upload_image(session: SessionDependency, username: UsernameDependency, in_file: UploadFile) -> Image:
    if in_file.size > 20 * 1024 * 1024:
        raise ClientErrorException(status_code=413, detail="File too large")

    file_id = uuid.uuid4().hex
    file_path = get_file_path(username, file_id)
    created_variants = 'avatar'
    local_file_path = configure.get_store_path(file_path)
    with open(local_file_path, 'wb') as out_file:
        out_file.write(in_file.file.read())

    resized_file_path = file_path + f"_avatar"
    local_resized_file_path = configure.get_store_path(resized_file_path)
    await resize_file(local_file_path, local_resized_file_path, 'avatar')
    if configure.use_s3_for_store():
        try:
            client = configure.get_s3_client()
            await asyncio.gather(
                asyncio.to_thread(client.upload_file, local_file_path, configure.get_s3_bucket(), file_path),
                asyncio.to_thread(client.upload_file, local_resized_file_path, configure.get_s3_bucket(),
                                  resized_file_path),
            )
        finally:
            safe_remove(local_file_path)
            safe_remove(local_resized_file_path)

    image = Image(file_id=file_id, file_type=in_file.content_type, created_variants=created_variants)
    session.add(image)
    session.commit()
    session.refresh(image)

    return image


@router.get('/{file_id}/{size}')
async def read_image(session: SessionDependency, username: UsernameDependency, file_id: str, size: str):
    image, file_path = get_image_and_file_path_or_404(session, username, file_id)

    if size != "original" and size != "display":
        resized_file_path = file_path + f"_{size}"
        if not image.created_variants:
            image.created_variants = ''
        if size not in image.created_variants:
            local_file_path = configure.get_store_path(file_path)
            local_resized_file_path = configure.get_store_path(resized_file_path)
            os.makedirs(os.path.dirname(local_resized_file_path), exist_ok=True)
            if configure.use_s3_for_store():
                try:
                    client = configure.get_s3_client()
                    response = client.get_object(Bucket=configure.get_s3_bucket(), Key=f'{file_path}')
                    with open(local_file_path, 'wb') as f:
                        f.write(response['Body'].read())
                    await resize_file(local_file_path, local_resized_file_path, size)
                    put_file(local_resized_file_path, resized_file_path)
                finally:
                    safe_remove(local_resized_file_path)
                    safe_remove(local_file_path)
            else:
                await resize_file(local_file_path, local_resized_file_path, size)

        image.created_variants = image.created_variants + size + ','
        session.add(image)
        session.commit()
        return response_file(resized_file_path)

    return response_file(file_path)


class ImageDeleted(BaseModel):
    detail: str = 'Image was deleted'


@router.delete('/{file_id}')
async def delete_image(session: SessionDependency, username: UsernameDependency, file_id: str) -> ImageDeleted:
    image, file_path = get_image_and_file_path_or_404(session, username, file_id)

    for variant in image.created_variants.split(',') if image.created_variants else []:
        if variant:
            resized_file_path = file_path + f"_{variant}"
            try:
                delete_file(resized_file_path)
            except:
                pass

    delete_file(file_path)
    return ImageDeleted()
