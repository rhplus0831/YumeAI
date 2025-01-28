"use server";

import LoreBookReaderBox from "@/components/features/lore/LoreBookReaderBox";
import {readLoreBook} from "@/lib/data/lore/ReadLoreBook";

interface LoreBookPageParams {
    id: string
}

export default async function LoreBookPage({params}: {
    params: Promise<LoreBookPageParams>
}) {
    const {id} = await params
    const book = await readLoreBook(id)

    return (<LoreBookReaderBox startBook={book}/>)
}