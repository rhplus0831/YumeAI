"use server";

import NavigateButton from "@/components/ui/NavigateButton";
import {getLoreBooks} from "@/lib/data/lore/LoreBook";
import LoreBookCreateButton from "@/components/features/lore/LoreBookCreateButton";


export default async function LorePage() {
    const lorebooks = await getLoreBooks()

    return (<section className={"w-full flex flex-col gap-4"}>
        <LoreBookCreateButton/>
        {lorebooks.map((lorebook) => (<NavigateButton href={`/lores/${lorebook.id}`} key={lorebook.id}>
            {lorebook.name}
        </NavigateButton>))}
    </section>)
}