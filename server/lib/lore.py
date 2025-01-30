from typing import Optional

from sqlmodel import Session, col, select

from database.sql import sql_exec
from database.sql_model import LoreBookChapter, Lore, Room, LoreBookReader, Conversation, LoreBook
from lib import tokenizer
from lib.cbs import CBSHelper
from lib.prompt import parse_prompt


class ParsedChapter:
    def __init__(self, parent: Optional["ParsedChapter"], original: LoreBookChapter):
        self.elements = []
        self.parent = parent
        self.greedy = original.greedy
        self.header = original.header
        self.footer = original.footer


class LoreParser:
    def __init__(self, session: Session, cbs: CBSHelper = None):
        self.parsed_chapters = []
        self.chapter_to_parsed_map = {}
        self.lore_to_parsed_chapter_map = {}
        self.session = session
        self.cbs = cbs

    def put_chapter(self, chapter: LoreBookChapter) -> ParsedChapter:
        parent: Optional[ParsedChapter] = None
        if chapter.parent_id is not None:
            parent = self.put_chapter(chapter.parent)
        if chapter not in self.chapter_to_parsed_map:
            parsed_chapter = ParsedChapter(parent, chapter)
            if parent is not None:
                parent.elements.append(parsed_chapter)
            else:
                self.parsed_chapters.append(parsed_chapter)
            self.chapter_to_parsed_map[chapter] = parsed_chapter
            attached_query = sql_exec(self.session, select(Lore).where(Lore.chapter_id == chapter.id).where(
                Lore.attached == True)).all()
            for attached in attached_query:
                self.add_lore(attached)
        else:
            parsed_chapter = self.chapter_to_parsed_map[chapter]
        return parsed_chapter

    def add_lore(self, lore: Lore) -> None:
        if lore.id in self.lore_to_parsed_chapter_map:
            return
        chapter = self.put_chapter(lore.chapter)
        #  이 조건식이 없으면, put_chapter가 attached 로어를 넣었는데 'lores'가 그것과 동일한경우 같은 로어가 두개 등록되게 됩니다.
        if lore in self.lore_to_parsed_chapter_map:
            return
        chapter.elements.append(lore)
        self.lore_to_parsed_chapter_map[lore] = chapter

    def summarize_lore(self, lore: Lore) -> None:
        if lore not in self.lore_to_parsed_chapter_map:
            return

        parsed_chapter = self.lore_to_parsed_chapter_map[lore]
        for k, v in enumerate(parsed_chapter.elements):
            if v == lore:
                parsed_chapter.elements[k] = lore.summarized
                del self.lore_to_parsed_chapter_map[lore]
                self.lore_to_parsed_chapter_map[lore.summarized] = parsed_chapter

    def remove_lore(self, lore: Lore) -> None:
        if lore not in self.lore_to_parsed_chapter_map:
            return

        def trim_chapter(parsed_chapter: ParsedChapter):
            if len(parsed_chapter.elements) == 0:
                if parsed_chapter.parent is None:
                    self.parsed_chapters.remove(parsed_chapter)
                else:
                    parsed_chapter.parent.elements.remove(parsed_chapter)
                    trim_chapter(parsed_chapter.parent)
                found_key = None
                for k, v in self.chapter_to_parsed_map.items():
                    if v == parsed_chapter:
                        found_key = k
                        break

                if found_key is not None:
                    del self.chapter_to_parsed_map[found_key]

        parsed_chapter = self.lore_to_parsed_chapter_map[lore]
        for k, v in enumerate(parsed_chapter.elements):
            if v == lore:
                del parsed_chapter.elements[k]
                del self.lore_to_parsed_chapter_map[lore]
                trim_chapter(parsed_chapter)
                return

    def build(self):
        result = []

        def process_parsed_chapter(paring_chapter: ParsedChapter):
            if paring_chapter.header != '':
                result.append(parse_prompt(paring_chapter.header, self.cbs)[0])

            delayed_chapters = []
            for element in paring_chapter.elements:
                if isinstance(element, ParsedChapter):
                    element: ParsedChapter
                    if paring_chapter.greedy:
                        delayed_chapters.append(element)
                    else:
                        process_parsed_chapter(element)
                else:
                    element: Lore
                    result.append(parse_prompt(element.content, self.cbs)[0])

            for parsed_chapter in delayed_chapters:
                process_parsed_chapter(parsed_chapter)

            if paring_chapter.footer != '':
                result.append(parse_prompt(paring_chapter.footer, self.cbs)[0])

        for chapter in self.parsed_chapters:
            process_parsed_chapter(chapter)

        return '\n'.join(result)


def run_parser_on_lores(parsed: LoreParser, lores: list[Lore], extra_text_list: list[str],
                        conversations: list[Conversation], token_limit_override=-1):
    for lore in lores:
        if not lore.searchable:
            continue
        if lore.always:
            parsed.add_lore(lore)
        keyword: str
        found = False

        def check_keyword_match(content):
            nonlocal found
            start_inx = content.find(keyword)
            if start_inx != -1:
                parsed.add_lore(lore)
                found = True
            return start_inx

        if lore.keyword.strip() == '':
            continue

        for keyword in lore.keyword.split(','):
            if found:
                break
            keyword = keyword.strip()
            for extra_text in extra_text_list:
                if found:
                    break
                check_keyword_match(extra_text)
            if found:
                break
            for conversation in conversations:
                if found:
                    break
                check_keyword_match(conversation.user_message)
                if found:
                    break
                check_keyword_match(conversation.assistant_message)

    max_token_for_lore = 1000
    if token_limit_override != -1:
        max_token_for_lore = token_limit_override

    summary_drained = False

    while True:
        result = parsed.build()
        result_encoded = tokenizer.get_tokens(result)
        if len(result_encoded) <= max_token_for_lore:
            return parsed

        if not summary_drained:
            ordered_lore_summary_priority = sorted(parsed.lore_to_parsed_chapter_map.keys(),
                                                   key=lambda x: x.summary_priority)

            something_summarized = False
            # 토큰수가 초과한 시점에서 요약 프로세스 시작
            for lore in ordered_lore_summary_priority:
                if something_summarized:
                    break
                if lore.summary_priority < 0:
                    continue
                if lore.summarized_id is not None:
                    parsed.summarize_lore(lore)
                    something_summarized = True
                elif lore.throw_on_summarize:
                    parsed.remove_lore(lore)
                    something_summarized = True
            if something_summarized:
                continue

        summary_drained = True
        ordered_lore_priority = sorted(parsed.lore_to_parsed_chapter_map.keys(), key=lambda x: x.priority)

        while True:
            pop = ordered_lore_priority.pop(0)
            if pop.summarized_id is not None:
                parsed.summarize_lore(pop)
                break
            if pop.attached:
                continue
            parsed.remove_lore(pop)
            result = parsed.build()
            result_encoded = tokenizer.get_tokens(result)
            if len(result_encoded) <= max_token_for_lore:
                return parsed


def parse_lore(session: Session, cbs: CBSHelper, room: Optional[Room] = None, extra_text_list: Optional[list] = None,
               token_limit_override=-1):
    if extra_text_list is None:
        extra_text_list = []

    lore_book_readers = sql_exec(session, select(LoreBookReader).where(LoreBookReader.reader_id == room.id)).all()
    if len(lore_book_readers) == 0 and room.bot.lore_book_id is None:
        return ''

    # TODO: Impl
    search_depth = 9999
    lore_books = []
    lores = []
    for lore_book_reader in lore_book_readers:
        if search_depth < lore_book_reader.search_depth:
            search_depth = lore_book_reader.search_depth
        lore_books.append(lore_book_reader.lore_book)
        lore_query = sql_exec(session, select(Lore).where(Lore.lore_book_id == lore_book_reader.lore_book_id)).all()
        for lore in lore_query:
            lores.append(lore)

    if room.bot.lore_book_id:
        bot_lore_book = sql_exec(session, select(LoreBook).where(LoreBook.id == room.bot.lore_book_id)).first()
        if bot_lore_book is not None:
            lore_books.append(bot_lore_book)
            lore_query = sql_exec(session, select(Lore).where(Lore.lore_book_id == bot_lore_book.id)).all()
            for lore in lore_query:
                lores.append(lore)

    conversations = []
    if room is not None:
        conversation_query = sql_exec(session, 
            select(Conversation).where(Conversation.room_id == room.id).order_by(
                col(Conversation.created_at).desc()).limit(
                search_depth)).all()

        for conversation in conversation_query:
            conversations.append(conversation)

    parsed = LoreParser(session, cbs)
    return run_parser_on_lores(parsed, lores, extra_text_list, conversations, token_limit_override).build()
