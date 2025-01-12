import {PersonaBox} from "@/components/features/persona/PersonaBox";
import NavigateButton from "@/components/ui/NavigateButton";
import {getBots} from "@/lib/data/Bot";
import BotCreateButton from "@/components/features/bot/BotCreateButton";

export const dynamic = 'force-dynamic'


export default async function PersonasPage() {
    const personas = await getBots()

    return (<section className={"w-full flex flex-col gap-4"}>
        <BotCreateButton/>
        {personas.map((bot) => (<NavigateButton href={`/bots/${bot.id}`} key={bot.id}>
            <PersonaBox persona={bot}/>
        </NavigateButton>))}
    </section>)
}