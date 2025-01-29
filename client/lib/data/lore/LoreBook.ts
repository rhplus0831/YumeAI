import BaseData from "@/lib/data/BaseData";
import {api} from "@/lib/api-client";

export default interface LoreBook extends BaseData {
    name: string,
    description: string
}

export async function createLoreBook(name: string): Promise<LoreBook> {
    return await api('lorebook', {
        method: 'POST',
        body: JSON.stringify({
            "name": name
        })
    })
}

export async function getLoreBooks(offset: number = 0, limit: number = 100): Promise<LoreBook[]> {
    return await api(`lorebook?offset=${offset}&limit=${limit}`, {
        method: 'GET'
    })
}

export async function getLoreBook(id: string): Promise<LoreBook> {
    return await api(`lorebook/${id}`, {
        method: 'GET'
    })
}

export async function updateLoreBook(id: string, book: Partial<LoreBook>): Promise<LoreBook> {
    return await api(`lorebook/${id}`, {
        method: 'PUT',
        body: JSON.stringify(book)
    })
}

export async function deleteLoreBook(id: string) {
    return await api(`lorebook/${id}`, {
        method: 'DELETE'
    })
}