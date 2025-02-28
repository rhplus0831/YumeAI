"use server";

import {PersonaBox} from "@/components/features/persona/PersonaBox";
import NavigateButton from "@/components/ui/NavigateButton";
import {getBots} from "@/lib/data/bot/Bot";
import BotCreateButton from "@/components/features/bot/BotCreateButton";
import BotImportButton from "@/components/features/bot/BotImportButton";


export default async function PersonasPage() {
    const bots = await getBots()

    return (<section className={"w-full flex flex-col gap-4"}>
        <BotCreateButton/>
        <BotImportButton/>
        {bots.map((bot) => (<NavigateButton href={`/bots/${bot.id}`} key={bot.id}>
            <PersonaBox persona={bot}/>
        </NavigateButton>))}
    </section>)
}