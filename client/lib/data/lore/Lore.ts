import BaseData from "@/lib/data/BaseData";
import {api} from "@/lib/api-client";
import LoreBook from "@/lib/data/lore/LoreBook";
import {LoreChapterBase} from "@/lib/data/lore/LoreChapter";

export interface LoreBase extends BaseData {
    name: string,
    content: string,
    keyword: string,

    searchable: boolean,
    attached: boolean,
    always: boolean,

    display_order: number,
    order: number,

    priority: number,
    summary_priority: number,
    throw_on_summarize: boolean,
}

export default interface Lore extends LoreBase {
    summarized: Lore | undefined
}

export interface RawLore extends LoreBase {
    lore_book_id: string,
    chapter_id: string,
    summarized_id: string | undefined
}

export async function createLore(book: LoreBook, chapter: LoreChapterBase, name: string): Promise<RawLore> {
    return await api(`lorebook/${book.id}/chapter/${chapter.id}/lore`, {
        method: 'POST',
        body: JSON.stringify({
            name: name
        })
    })
}

export async function updateLore(book: LoreBook, chapter: LoreChapterBase, id: string, data: Partial<Lore>): Promise<RawLore> {
    return await api(`lorebook/${book.id}/chapter/${chapter.id}/lore/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deleteLore(book: LoreBook, chapter: LoreChapterBase, id: string) {
    return await api(`lorebook/${book.id}/chapter/${chapter.id}/lore/${id}`, {
        method: 'DELETE'
    })
}