import {getRoom} from "@/lib/data/Room";
import RoomViewer from "@/app/rooms/[id]/RoomViewer";

interface RoomPageParams {
    id: number
}

export const dynamic = 'force-dynamic'

export default async function RoomPage({params}: {
    params: Promise<RoomPageParams>
}) {
    const {id} = await params
    const room = await getRoom(id)

    return (<RoomViewer startRoom={room}/>)
}