from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session

from api import common, image
from database.sql_model import PersonaBase, Persona

router = APIRouter(prefix="/persona", tags=["persona"])
# noinspection DuplicatedCode
engine: Engine
persona_not_exist_model: BaseModel | None = None


class PersonaUpdate(BaseModel):
    name: str | None = None
    displayName: str | None = None
    profileImageId: str | None = None
    prompt: str | None = None


common.validate_update_model(PersonaBase, PersonaUpdate)


def get_persona_or_404(persona_id: int, session: Session) -> Persona:
    return common.get_or_404(Persona, session, persona_id)


def register():
    @router.post('/{id}/profile_image', responses={200: {'model': Persona}, 404: {'model': persona_not_exist_model}})
    async def update_profile_image(id: int, image_file: UploadFile) -> Persona:
        with Session(engine) as session:
            persona = get_persona_or_404(id, session)

        if persona.profileImageId is not None:
            await image.delete_image(file_id=persona.profileImageId)

        uploaded = await image.upload_image(image_file)
        persona.profileImageId = uploaded.file_id

        with Session(engine) as session:
            session.add(persona)
            session.commit()
            session.refresh(persona)

        return persona
