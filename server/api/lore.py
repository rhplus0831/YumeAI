from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session, select
from starlette.responses import Response

from api import common
from api.common import SessionDependency, ClientErrorException
from database.sql_model import LoreBook, LoreBookBase, LoreBookChapter, LoreBookChapterBase, Lore
from lib.lore import run_parser_on_lores, LoreParser

router = APIRouter(prefix="/lorebook", tags=["lorebook"])


class LoreBookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


common.validate_update_model(LoreBookBase, LoreBookUpdate)


class LoreBookChapterCreate(BaseModel):
    name: str


class LoreBookChapterUpdate(BaseModel):
    lore_book_id: Optional[str] = None

    parent_id: Optional[str] = None

    name: Optional[str] = None
    description: Optional[str] = None

    header: Optional[str] = None
    footer: Optional[str] = None

    # 이 옵션이 켜져있으면 하위 챕터를 진행하기 전에 자신이 가지고 있는 모든 로어를 체크한 후 하위 챕터를 진행합니다.
    # 마크 다운 레벨을 지켜야 하는 경우 유용할 수 있습니다.
    greedy: Optional[bool] = None

    display_order: Optional[int] = None


common.validate_update_model(LoreBookChapterBase, LoreBookChapterUpdate)


class LoreCreate(BaseModel):
    name: str


class LoreUpdate(BaseModel):
    id: Optional[str] = None
    lore_book_id: Optional[str] = None
    chapter_id: Optional[str] = None

    name: Optional[str] = None
    content: Optional[str] = None
    keyword: Optional[str] = None

    searchable: Optional[bool] = None
    # 이 설정이 붙은 로어는 챕터가 활성화 되었을때 자동으로 포함됩니다.
    attached: Optional[bool] = None
    always: Optional[bool] = None

    display_order: Optional[int] = None
    order: Optional[int] = None

    priority: Optional[int] = None
    summary_priority: Optional[int] = None
    throw_on_summarize: Optional[bool] = None
    summarized_id: Optional[str] = None


async def lore_book_delete_side_effect(session: Session, username: str, lore_book: LoreBook):
    for chapter in session.exec(select(LoreBookChapter).where(LoreBookChapter.lore_book_id == lore_book.id)).all():
        for lore in session.exec(select(Lore).where(Lore.chapter_id == chapter.id)).all():
            session.delete(lore)
        session.delete(chapter)
    session.commit()


def register():
    common.insert_crud(router, LoreBookBase, LoreBook, LoreBookUpdate,
                       handle_delete_side_effect=lore_book_delete_side_effect)

    @router.get("/{id}/read")
    def read_lore_book(session: SessionDependency, id: str):
        lore_book = common.get_or_404(LoreBook, session, id)
        chapter_list = session.exec(select(LoreBookChapter).where(LoreBookChapter.lore_book_id == id)).all()
        lore_list = session.exec(select(Lore).where(Lore.lore_book_id == id)).all()
        return {"book": lore_book, "chapters": chapter_list, "lores": lore_list}

    class LoreBookTestArgument(BaseModel):
        trigger: str

    @router.post("/{id}/test")
    def test_arg(session: SessionDependency, id: str, arg: LoreBookTestArgument):
        lore_list = session.exec(select(Lore).where(Lore.lore_book_id == id)).all()
        parsed = LoreParser(session)
        return {
            "result": run_parser_on_lores(parsed, lore_list, [arg.trigger], [], -1).build()
        }

    def internal_create_chapter(session: Session, id: str, chapter_data: LoreBookChapterCreate,
                                parent_id: Optional[str] = None):
        lore_book = common.get_or_404(LoreBook, session, id)
        chapter = LoreBookChapter()
        chapter.lore_book_id = lore_book.id
        chapter.name = chapter_data.name
        chapter.description = ""
        chapter.header = ""
        chapter.footer = ""
        chapter.greedy = False
        chapter.display_order = 0

        if parent_id:
            chapter.parent_id = parent_id

        session.add(chapter)
        session.commit()
        session.refresh(chapter)
        return chapter

    @router.post("/{id}/chapter")
    def create_chapter(session: SessionDependency, id: str, chapter_data: LoreBookChapterCreate):
        return internal_create_chapter(session, id, chapter_data)

    @router.post("/{id}/chapter/{chapter_id}/child")
    def create_child_chapter(session: SessionDependency, id: str, chapter_id: str, chapter: LoreBookChapterCreate):
        return internal_create_chapter(session, id, chapter, chapter_id)

    @router.put("/{id}/chapter/{chapter_id}")
    def update_chapter(session: SessionDependency, id: str, chapter_id: str, chapter_data: LoreBookChapterUpdate):
        # lore_book = common.get_or_404(LoreBook, session, id)
        chapter = common.get_or_404(LoreBookChapter, session, chapter_id)
        if chapter.lore_book_id != id:
            raise ClientErrorException(status_code=400, detail='Wrong Lorebook?')
        update_data = chapter_data.model_dump(exclude_unset=True)
        chapter.sqlmodel_update(update_data)
        session.add(chapter)
        session.commit()
        session.refresh(chapter)
        return chapter

    def internal_delete_chapter(session: Session, chapter: LoreBookChapter):
        for lore in session.exec(select(Lore).where(Lore.chapter_id == chapter.id)).all():
            session.delete(lore)

        for child in session.exec(select(LoreBookChapter).where(LoreBookChapter.parent_id == chapter.id)).all():
            internal_delete_chapter(session, child)

        session.delete(chapter)

    @router.delete("/{id}/chapter/{chapter_id}")
    def delete_chapter(session: SessionDependency, id: str, chapter_id: str):
        chapter = common.get_or_404(LoreBookChapter, session, chapter_id)
        if chapter.lore_book_id != id:
            raise ClientErrorException(status_code=400, detail='Wrong Lorebook?')

        internal_delete_chapter(session, chapter)
        session.commit()
        return Response(status_code=204)

    @router.post("/{id}/chapter/{chapter_id}/lore")
    def create_lore(session: SessionDependency, id: str, chapter_id: str, lore_data: LoreCreate):
        chapter = common.get_or_404(LoreBookChapter, session, chapter_id)
        if chapter.lore_book_id != id:
            raise ClientErrorException(status_code=400, detail='Wrong Lorebook?')
        lore = Lore()
        lore.lore_book_id = id
        lore.chapter_id = chapter_id
        lore.name = lore_data.name
        lore.content = ""
        lore.keyword = ""
        lore.searchable = True
        lore.attached = False
        lore.always = False
        lore.display_order = 0
        lore.order = 0
        lore.priority = 0
        lore.summary_priority = 0
        lore.throw_on_summarize = False
        lore.summarized_id = None
        session.add(lore)
        session.commit()
        session.refresh(lore)
        return lore

    @router.put("/{id}/chapter/{chapter_id}/lore/{lore_id}")
    def update_lore(session: SessionDependency, id: str, chapter_id: str, lore_id: str, lore_data: LoreUpdate):
        lore = common.get_or_404(Lore, session, lore_id)
        if lore.lore_book_id != id:
            raise ClientErrorException(status_code=400, detail='Wrong Lorebook?')
        if lore.chapter_id != chapter_id:
            raise ClientErrorException(status_code=400, detail='Wrong Chapter?')
        update_data = lore_data.model_dump(exclude_unset=True)
        lore.sqlmodel_update(update_data)
        session.add(lore)
        session.commit()
        session.refresh(lore)
        return lore

    def internal_delete_lore(session: Session, lore: Lore):
        if lore.summarized_id is not None:
            try:
                internal_delete_lore(session, common.get_or_404(Lore, session, lore.summarized_id))
            except:
                pass

        session.delete(lore)

    @router.delete("/{id}/chapter/{chapter_id}/lore/{lore_id}")
    def delete_lore(session: SessionDependency, id: str, chapter_id: str, lore_id: str):
        lore = common.get_or_404(Lore, session, lore_id)
        if lore.chapter_id != chapter_id:
            raise ClientErrorException(status_code=400, detail='Wrong Chapter?')
        if lore.lore_book_id != id:
            raise ClientErrorException(status_code=400, detail='Wrong Lorebook?')
        internal_delete_lore(session, lore)
        session.commit()
        return Response(status_code=204)
