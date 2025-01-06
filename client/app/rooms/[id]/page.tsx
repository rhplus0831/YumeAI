import {getRoom} from "@/lib/data/Room";

interface RoomPageParams {
    id: number
}

export const dynamic = 'force-dynamic'

export default async function RoomPage({params}: {
    params: RoomPageParams
}) {
    const {id} = await params

    const room = await getRoom(id)

    return (<section>
        {room.name}
    </section>)
}