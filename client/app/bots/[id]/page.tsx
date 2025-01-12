import {getBot} from "@/lib/data/Bot";
import BotViewer from "@/app/bots/[id]/BotViewer";

interface BotPageParams {
    id: number
}

export const dynamic = 'force-dynamic'

export default async function BotPage({params}: {
    params: Promise<BotPageParams>
}) {
    const {id} = await params
    const bot = await getBot(id)

    return (<BotViewer startBot={bot}/>)
}