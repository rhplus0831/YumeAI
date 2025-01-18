import PersonaViewer from "@/app/personas/[id]/PersonaViewer";
import {getPersona} from "@/lib/data/Persona";

interface PersonaPageParams {
    id: string
}

export const dynamic = 'force-dynamic'

export default async function PersonaPage({params}: {
    params: Promise<PersonaPageParams>
}) {
    const {id} = await params
    const persona = await getPersona(id)

    return (<PersonaViewer startPersona={persona}/>)
}