from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from sqlmodel import Session

from api import common, image
from api.common import UsernameDependency, SessionDependency
from database.sql_model import PersonaBase, Persona

router = APIRouter(prefix="/persona", tags=["persona"])
# noinspection DuplicatedCode
persona_not_exist_model: BaseModel | None = None


class PersonaUpdate(BaseModel):
    name: str | None = None
    displayName: str | None = None
    profileImageId: str | None = None
    prompt: str | None = None


common.validate_update_model(PersonaBase, PersonaUpdate)


def get_persona_or_404(persona_id: str, session: Session) -> Persona:
    return common.get_or_404(Persona, session, persona_id)


async def persona_delete_side_effect(session: Session, username: str, persona: Persona):
    if persona.profileImageId is not None:
        await image.delete_image(session, username, file_id=persona.profileImageId)


def register():
    @router.post('/{id}/profile_image', responses={200: {'model': Persona}, 404: {'model': persona_not_exist_model}})
    async def update_profile_image(session: SessionDependency, username: UsernameDependency, id: str,
                                   image_file: UploadFile) -> Persona:
        persona = get_persona_or_404(id, session)

        if persona.profileImageId is not None:
            await image.delete_image(session, username, file_id=persona.profileImageId)

        uploaded = await image.upload_image(session, username, image_file)
        persona.profileImageId = uploaded.file_id

        session.add(persona)
        session.commit()
        session.refresh(persona)

        return persona
