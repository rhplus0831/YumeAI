import uuid

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy import Select
from sqlmodel import Session, select

from api.common import ClientErrorException, UsernameDependency, SessionDependency
from database.sql_model import Image
from lib.storage import response_file, delete_file, put_file

router = APIRouter(prefix="/image", tags=["image"])


def get_file_path(user_id: str, file_id: str) -> str:
    return f'{user_id}/image/{file_id}'


def get_image_and_file_path_or_404(session: Session, user_id: str, file_id: str) -> (Image, str):
    statement: Select = select(Image).where(Image.file_id == file_id)
    image = session.exec(statement).one_or_none()
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


@router.post('')
async def upload_image(session: SessionDependency, username: UsernameDependency, in_file: UploadFile) -> Image:
    if in_file.size > 20 * 1024 * 1024:
        raise ClientErrorException(status_code=413, detail="File too large")

    file_id = uuid.uuid4().hex
    file_path = get_file_path(username, file_id)
    put_file(session, in_file.file, file_path)

    image = Image(file_id=file_id, file_type=in_file.content_type)
    session.add(image)
    session.commit()
    session.refresh(image)

    return image


@router.post('/{file_id}')
async def restore_image(session: SessionDependency, username: UsernameDependency, file_id: str,
                        in_file: UploadFile) -> Image:
    image = session.exec(select(Image).where(Image.file_id == file_id)).one_or_none()
    if image is None:
        image = Image(file_id=file_id, file_type=in_file.content_type)
    file_path = get_file_path(username, file_id)
    put_file(session, in_file.file, file_path)

    session.add(image)
    session.commit()
    session.refresh(image)

    return image


@router.get('/{file_id}/info')
async def get_image_info(session: SessionDependency, username: UsernameDependency, file_id: str):
    image, file_path = get_image_and_file_path_or_404(session, username, file_id)
    return image


@router.get('/{file_id}')
async def read_image(session: SessionDependency, username: UsernameDependency, file_id: str):
    image, file_path = get_image_and_file_path_or_404(session, username, file_id)
    return response_file(file_path, image.file_type)


class ImageDeleted(BaseModel):
    detail: str = 'Image was deleted'


@router.delete('/{file_id}')
async def delete_image(session: SessionDependency, username: UsernameDependency, file_id: str) -> ImageDeleted:
    image, file_path = get_image_and_file_path_or_404(session, username, file_id)
    delete_file(session, file_path)
    return ImageDeleted()
