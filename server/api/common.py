from typing import Type, Sequence, Callable, Any, Annotated

from fastapi import APIRouter
from fastapi.params import Query, Depends
from pydantic import BaseModel, create_model
from sqlmodel import SQLModel, Session, select
from starlette.requests import Request


def get_db(request: Request):
    return request.state.db


EngineDependency = Annotated[Session, Depends(get_db)]


def get_username(request: Request):
    return request.state.username


UsernameDependency = Annotated[str, Depends(get_username)]


def get_session(request: Request):
    with Session(request.state.db) as session:
        yield session


SessionDependency = Annotated[Session, Depends(get_session)]


class ClientErrorException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail: str = detail


def validate_update_model(base_model: Type[SQLModel], update_model: Type[BaseModel]):
    base_keys = dict(base_model.__dict__)['__annotations__'].keys()
    update_keys = dict(update_model.__dict__)['__annotations__'].keys()

    if base_keys != update_keys:
        raise Exception(f"{base_model.__name__} is not matching with {update_model.__name__}")


def validate_get_model(base_model: Type[SQLModel], get_model: Type[BaseModel], exclude_list=[]):
    base_keys = dict(base_model.__dict__)['__annotations__'].keys()
    get_keys = dict(get_model.__dict__)['__annotations__'].keys()

    base_keys = list(map(lambda k: k.replace('_id', ''), base_keys))
    get_keys = list(filter(lambda k: k != 'id' and k not in exclude_list, get_keys))

    if base_keys != get_keys:
        print(base_keys)
        print(get_keys)
        raise Exception(f"{base_model.__name__} is not matching with {get_model.__name__}")


def get_or_404(db_model: Type[SQLModel], session: Session, id: int):
    statement = select(db_model).where(db_model.id == id)
    item = session.exec(statement).one_or_none()
    if item is None:
        raise ClientErrorException(status_code=404, detail=f"{db_model.__name__} does not exist")
    return item


def insert_crud(router: APIRouter, base_model: Type[SQLModel], db_model: Type[SQLModel], update_model: Type[BaseModel],
                handle_delete_side_effect: Callable[[Session, Any], None] | None = None,
                get_model: Type[BaseModel] | None = None, skip_get_list=False) -> BaseModel:
    data_name = db_model.__name__
    lower_name = data_name.lower()

    not_exist_data = {
        'detail': (str, f'{data_name} does not exist')
    }
    not_exist_model = create_model(f'{data_name}NotExist', **not_exist_data)

    if get_model is None:
        get_model = db_model

    def create(base: base_model, session: Session = Depends(get_session)):
        item = db_model.model_validate(base)
        session.add(item)
        session.commit()
        session.refresh(item)
        return item

    def get(id: int, session: Session = Depends(get_session)) -> get_model:
        return get_or_404(db_model, session, id)

    list_data = {
        f'{lower_name}s': (Sequence[get_model], None)
    }
    list_model = create_model(f'{data_name}List', **list_data)

    def gets(offset: int = 0, limit: int = Query(default=100, le=100), session: Session = Depends(get_session)) -> \
            Sequence[get_model]:
        items = session.exec(select(db_model).offset(offset).limit(limit)).all()
        return items

    def update(id: int, base_update: update_model, session: Session = Depends(get_session)) -> get_model:
        data = get_or_404(db_model, session, id)
        update_data = base_update.model_dump(exclude_unset=True)
        data.sqlmodel_update(update_data)
        session.add(data)
        session.commit()
        session.refresh(data)
        return data

    deleted_data = {
        'detail': (str, f'{data_name} was deleted')
    }
    deleted_model = create_model(f'{data_name}Deleted', **deleted_data)

    def delete(id: int, session: Session = Depends(get_session)):
        data = get_or_404(db_model, session, id)
        session.delete(data)
        session.commit()
        if handle_delete_side_effect is not None:
            handle_delete_side_effect(session, data)
        return deleted_model()

    router.add_api_route('/', endpoint=create, methods=['POST'], response_model=db_model,
                         name=f'Create {data_name}')
    router.add_api_route('/{id}', endpoint=get, name=f'Get {data_name}',
                         responses={200: {'model': get_model}, 404: {'model': not_exist_model}})
    if not skip_get_list:
        router.add_api_route('/', endpoint=gets, name=f'Get {data_name}s',
                             responses={200: {'model': list_model}, 404: {'model': not_exist_model}})
    router.add_api_route('/{id}', endpoint=update, methods=['PUT'], name=f'Update {data_name}',
                         responses={200: {'model': get_model}, 404: {'model': not_exist_model}})
    router.add_api_route('/{id}', endpoint=delete, methods=['DELETE'], name=f'Delete {data_name}',
                         responses={200: {'model': deleted_model}, 404: {'model': not_exist_model}})

    return not_exist_model
