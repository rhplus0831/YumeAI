import {LoreChapterBase, RawLoreChapter} from "@/lib/data/lore/LoreChapter";
import LoreBook from "@/lib/data/lore/LoreBook";
import Lore, {RawLore} from "@/lib/data/lore/Lore";
import {api} from "@/lib/api-client";

export interface OpenedLoreBook extends LoreBook {
    chapters: OpenedLoreChapter[],
}

export interface OpenedLoreChapter extends LoreChapterBase {
    lores: Lore[]
    children: OpenedLoreChapter[]
}

export interface LoreBookReadResult {
    book: LoreBook,
    chapters: RawLoreChapter[],
    lores: RawLore[]
}

export async function testLoreBook(book: OpenedLoreBook, trigger: string) {

    return (await api(`lorebook/${book.id}/test`, {
        method: 'POST',
        body: JSON.stringify({
            trigger: trigger
        })
    })).result as string
}

interface ParentSet {
    parent_id: string,
    self: OpenedLoreChapter,
}

export async function readLoreBook(id: string): Promise<OpenedLoreBook> {
    const data: LoreBookReadResult = await api(`lorebook/${id}/read`, {
        method: 'GET'
    })

    //일단 부모 정보를 캐싱한 뒤 클래스를 바꾸고
    const chapterMap = new Map<string, OpenedLoreChapter>();
    const chapterParentMap: ParentSet[] = []
    const rootChapterMap = new Map<string, OpenedLoreChapter>();
    data.chapters.forEach(chapter => {
        const {parent_id, ...rest} = chapter
        const result: OpenedLoreChapter = {...rest, lores: [], children: []}

        chapterMap.set(result.id, result)
        if (parent_id) {
            chapterParentMap.push({
                parent_id: parent_id,
                self: result,
            })
        } else {
            rootChapterMap.set(result.id, result)
        }
    })

    //부모 정보를 연결시키기
    chapterParentMap.forEach((data) => {
        chapterMap.get(data.parent_id)!.children.push(data.self)
    })

    //로어도 비슷한 방식을 수행
    //예전의 나는 무슨 생각이였는지 모르겠지만 Chapter는 parent 정보를 기록하는 방식이고
    //Lore는 Child 정보를 기록하는 방식이네
    const loreMap = new Map<string, Lore>();
    const loreChildMap = new Map<string, Lore>();
    data.lores.forEach((lore) => {
        const {summarized_id, ...rest} = lore
        const result: Lore = {...rest, summarized: undefined}
        loreMap.set(result.id, result)
        if (summarized_id) {
            loreChildMap.set(summarized_id, result)
        }

        //도는김에 로어의 정보도 등록
        chapterMap.get(lore.chapter_id)!.lores.push(result)
    })
    //요약 정보를 연결시키고
    loreChildMap.forEach((lore, id) => {
        lore.summarized = loreMap.get(id)
    })

    //특정 객체의 요약으로 등록되어 있는 로어이면 챕터에서는 제외
    for (const chapter of chapterMap.values()) {
        chapter.lores = chapter.lores.filter(l => loreChildMap.get(l.id) === undefined)
    }


    //최상위 챕터만 결과에 담음
    const result = {
        ...data.book,
        chapters: [...chapterMap.values().filter(c => rootChapterMap.get(c.id) !== undefined)],
        // chapterMap: chapterMap,
        // loreMap: loreMap,
    }

    result.chapters = result.chapters.sort((a, b) => a.display_order - b.display_order)

    console.log(data)
    console.log(result)

    return result
}