import {getPrompt} from "@/lib/data/Prompt";
import PromptViewer from "@/app/prompts/[id]/PromptViewer";

interface PersonaPageParams {
    id: number
}

export const dynamic = 'force-dynamic'

export default async function PromptPage({params}: {
    params: Promise<PersonaPageParams>
}) {
    const {id} = await params
    const persona = await getPrompt(id)

    return (<PromptViewer startPrompt={persona}/>)
}