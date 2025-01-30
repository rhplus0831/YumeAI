# -*- coding: utf-8 -*-

import difflib
import hashlib
from typing import Optional

from sqlmodel import Session

import configure
from database.sql import get_engine
from database.sql_model import LoreBook, LoreBookChapter, Lore, Room, LoreBookReader
from lib import tokenizer, lore
from lib.cbs import CBSHelper
from lib.lore import LoreParser


class TestLoreBuilder:
    def __init__(self, session: Session, name: str):
        self.session = session
        self.lore_book = LoreBook(name=name, description="")
        session.add(self.lore_book)
        session.commit()

        self.current_chapter = None
        pass

    def make_chapter(self, header, footer='', name='', parent: Optional[LoreBookChapter] = None, greedy=False):
        if name == '':
            name = hashlib.sha1((header + footer).encode('utf-8')).hexdigest()

        chapter = LoreBookChapter(lore_book_id=self.lore_book.id, name=name, description="", header=header,
                                  footer=footer,
                                  greedy=greedy,
                                  display_order=0)
        if parent is not None:
            chapter.parent_id = parent.id
        self.session.add(chapter)
        self.session.commit()
        self.current_chapter = chapter
        return chapter

    def make_lore(self, content, chapter=None, keyword='', name='', order=0, priority=0, summary_priority=0,
                  throw_on_summarize=False, summary=None, searchable=True, attached=False):
        if summary is None:
            summary = []
        if chapter is None:
            chapter = self.current_chapter
        if name == '':
            name = hashlib.sha1((content + keyword).encode('utf-8')).hexdigest()
        lore = Lore(lore_book_id=self.lore_book.id, chapter=chapter, name=name, content=content, keyword=keyword,
                    attached=attached, searchable=searchable,
                    always=keyword == '', display_order=0,
                    order=order, priority=priority, summary_priority=summary_priority,
                    throw_on_summarize=throw_on_summarize)
        if len(summary) != 0:
            summarized_lore = self.make_lore(summary[0], chapter, '', name, order, priority, summary_priority,
                                             throw_on_summarize, summary[1:], False, False)
            lore.summarized_id = summarized_lore.id

        self.session.add(lore)
        self.session.commit()
        return lore


if __name__ == '__main__':
    engine = get_engine(configure.get_fast_store_path("test.db"))
    session = Session(engine)

    room_name = 'test'
    room = Room(name=room_name)

    book = TestLoreBuilder(session, 'test')
    vocaloid = book.make_chapter('# 보컬로이드(Vocaloid)', greedy=True)
    attached_lore = book.make_lore(
        '''보컬로이드(Vocaloid)는 야마하 주식회사에 의해 개발된 음성 합성 기술을 기반으로 한 소프트웨어 제품군입니다. 이 기술은 사용자가 가상의 가수(보컬로이드 캐릭터)에게 노래를 부르게 할 수 있도록 설계되었어요. 사용자는 멜로디와 가사를 입력하면 보컬로이드 소프트웨어가 이를 기반으로 가상의 가수가 노래하는 것처럼 음성을 합성해내죠.''',
        attached=True, summary=[
            '보컬로이드(Vocaloid)는 야마하 주식회사에 의해 개발된 음성 합성 기술을 기반으로 한 소프트웨어 제품군, 사용자가 멜로디와 가사를 입력하면 이를 기반으로 가상의 가수가 노래하는 것처럼 음성을 합성',
            '보컬로이드(Vocaloid)는 야마하 주식회사에 의해 개발된 음성 합성 기술을 기반으로 한 소프트웨어 제품군']
        , keyword='보컬로이드', summary_priority=2)
    book.make_chapter('## 음성 합성 기술', parent=vocaloid)
    priority_test_lore = book.make_lore(
        '보컬로이드의 핵심은 음성 합성 기술에 있습니다. 실제 사람의 목소리를 녹음하여 다양한 음성 샘플을 만들고, 이를 소프트웨어가 분석하여 가상의 가수가 노래할 때 필요한 발음, 음색, 감정 표현 등을 재현할 수 있게 합니다. 사용자는 이 기술을 통해 자신만의 음악을 만들 수 있으며, 전문적인 음악 지식이 없는 사람들도 쉽게 다룰 수 있도록 설계되었습니다.'
        , keyword='음성 합성 기술')
    book.make_chapter('## 사용 범위와 인기', parent=vocaloid)
    book.make_lore(
        '보컬로이드는 그 사용범위가 매우 넓어, 개인 사용자로부터 전문 음악 제작자까지 다양한 사람들이 사용하고 있습니다. 특히, 일본에서는 보컬로이드를 사용한 음악이 큰 인기를 얻으면서, 다양한 캐릭터가 탄생했고, 그 중 몇몇은 큰 문화적 영향을 끼치기도 했어요. 예를 들어, 하츠네 미쿠는 가장 인기 있는 보컬로이드 캐릭터 중 하나로, 전 세계적으로 많은 팬을 보유하고 있으며, 음악은 물론 다양한 미디어와 문화 산업에서도 활약하고 있습니다.'
        , keyword='사용 범위')
    book.make_chapter('## 지속적인 발전', parent=vocaloid)
    summary_priority_test_lore = book.make_lore(
        '보컬로이드 소프트웨어는 시간이 지남에 따라 계속 발전하고 있으며, 더욱 다양하고 개성 있는 캐릭터와 더욱 진보된 음성 합성 기술을 선보이고 있습니다. 이로 인해 사용자들은 보다 자유롭게 창작 활동을 할 수 있게 되었습니다.'
        , keyword='지속적인 발전', summary=['보컬로이드 소프트웨어는 시간이 지남에 따라 계속 발전하고 있습니다.'], summary_priority=1)

    reader = LoreBookReader(reader_id=room.id, lore_book_id=book.lore_book.id, search_depth=3)
    session.add(reader)
    session.commit()


    def print_spliter(text):
        print("*" * 45)
        print(text)
        print("*" * 45)


    def print_parsed(title, parsed: LoreParser):
        print("**" + title + "**")
        print('')
        result = parsed.build()
        result_encoded = tokenizer.get_tokens(result)
        print(result)
        print(f"\n토큰 크기: {len(result_encoded)}개")
        print("-" * 45)
        return parsed


    def print_compare_parsed(title, before, after):
        print("**" + title + " (Compare)**\n")
        before_result = before.build()
        before_result_encoded = tokenizer.get_tokens(before_result)
        after_result = after.build()
        after_result_encoded = tokenizer.get_tokens(after_result)

        d = difflib.Differ()
        diff = d.compare(before_result.split('\n'), after_result.split('\n'))
        print("\n".join(diff))
        print(
            f"{len(before_result_encoded) - len(after_result_encoded)} tokens diff ({len(before_result_encoded)} tokens -> {len(after_result_encoded)} tokens)")
        print("-" * 45)


    cbs = CBSHelper()

    print_spliter("기초 테스트")
    print_parsed('보컬로이드', lore.parse_lore(session, cbs, room, ['보컬로이드']))
    result = print_parsed('음성 합성 기술', lore.parse_lore(session, cbs, room, ['음성 합성 기술']))
    print_compare_parsed('음성 합성 기술(200)', result, lore.parse_lore(session, cbs, room, ['음성 합성 기술'], 200))
    print_compare_parsed('음성 합성 기술(100)', result, lore.parse_lore(session, cbs, room, ['음성 합성 기술'], 100))

    print_spliter("검색 불가능 로어 테스트")
    attached_lore.searchable = False
    session.add(attached_lore)
    session.commit()
    print_parsed('보컬로이드 -> 로어 검색 불가능 처리', lore.parse_lore(session, cbs, room, ['보컬로이드']))

    print_spliter("활성화 로어 테스트")
    attached_lore.searchable = True
    attached_lore.always = True
    session.add(attached_lore)
    session.commit()
    print_parsed(' -> 항상 활성화 처리', lore.parse_lore(session, cbs, room, ['']))

    attached_lore.always = False
    session.add(attached_lore)
    session.commit()

    print_spliter("우선순위 테스트")
    result = print_parsed('음성 합성 기술 사용 범위 (200)', lore.parse_lore(session, cbs, room, ['음성 합성 기술 사용 범위'], 200))
    priority_test_lore.priority = 1
    session.add(priority_test_lore)
    session.commit()
    print_compare_parsed('음성 합성 기술 사용 범위 (200) -> 음성 합성 기술 우선', result,
                         lore.parse_lore(session, cbs, room, ['음성 합성 기술 사용 범위'], 200))

    print_spliter("요약 우선순위 테스트")
    result = print_parsed('음성 합성 기술 지속적인 발전', lore.parse_lore(session, cbs, room, ['음성 합성 기술 지속적인 발전']))
    print_compare_parsed('음성 합성 기술 지속적인 발전(200)', result,
                         lore.parse_lore(session, cbs, room, ['음성 합성 기술 지속적인 발전'], 200))
    summary_priority_test_lore.summary_priority = 2
    session.add(summary_priority_test_lore)
    session.commit()
    print_compare_parsed('음성 합성 기술 지속적인 발전(200) -> 지속적인 발전 우선', result,
                         lore.parse_lore(session, cbs, room, ['음성 합성 기술 지속적인 발전'], 200))
