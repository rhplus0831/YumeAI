import {getPersonas} from "@/lib/data/Persona";
import {PersonaBox} from "@/components/features/persona/PersonaBox";
import PersonaCreateButton from "@/components/features/persona/PersonaCreateButton";
import NavigateButton from "@/components/ui/NavigateButton";

export const dynamic = 'force-dynamic'


export default async function PersonasPage() {
    const personas = await getPersonas()

    return (<section className={"w-full flex flex-col gap-4"}>
        <PersonaCreateButton/>
        {personas.map((persona) => (<NavigateButton href={`/personas/${persona.id}`} key={persona.id} >
            <PersonaBox persona={persona} />
        </NavigateButton>))}
    </section>)
}