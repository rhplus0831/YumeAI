import BaseData from "@/lib/data/BaseData";
import LoreBook from "@/lib/data/lore/LoreBook";
import {api} from "@/lib/api-client";
import {OpenedLoreChapter} from "@/lib/data/lore/ReadLoreBook";

export interface LoreChapterBase extends BaseData {
    lore_book_id: string,
    name: string,
    description: string,
    header: string,
    footer: string,
    greedy: boolean,
    display_order: number

}

export default interface LoreChapter extends LoreChapterBase {
    parent: LoreChapter | undefined
}

export interface RawLoreChapter extends LoreChapterBase {
    parent_id: string | undefined
}

export async function createChapter(loreBook: LoreBook, name: string): Promise<RawLoreChapter> {
    return await api(`lorebook/${loreBook.id}/chapter`, {
        method: 'POST',
        body: JSON.stringify({
            name: name
        })
    })
}

export async function createChildChapter(loreBooK: LoreBook, parent: OpenedLoreChapter, name: string): Promise<RawLoreChapter> {
    return await api(`lorebook/${loreBooK.id}/chapter/${parent.id}/child`, {
        method: 'POST',
        body: JSON.stringify({
            name: name
        })
    })
}

export async function updateChapter(loreBook: LoreBook, id: string, chapter: Partial<LoreChapter>): Promise<RawLoreChapter> {
    return await api(`lorebook/${loreBook.id}/chapter/${id}`, {
        method: 'PUT',
        body: JSON.stringify(chapter)
    })
}

export async function deleteChapter(loreBook: LoreBook, chapter: OpenedLoreChapter): Promise<void> {
    return await api(`lorebook/${loreBook.id}/chapter/${chapter.id}`, {
        method: 'DELETE'
    })
}