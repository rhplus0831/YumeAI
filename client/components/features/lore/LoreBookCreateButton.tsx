"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createLoreBook} from "@/lib/data/lore/LoreBook";

export default function LoreBookCreateButton() {
    return <CreateWithNameButton dataName={"로어북"} createSelf={createLoreBook}/>
}