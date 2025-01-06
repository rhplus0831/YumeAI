import RoomCard from "@/components/features/room/RoomCard";
import RoomCreateButton from "@/components/features/room/RoomCreateButton";
import { getRooms } from "@/lib/data/Room";

export const dynamic = 'force-dynamic'


export default async function RoomsPage() {
    const rooms = await getRooms()

    return (<section className={"w-full flex flex-col gap-4"}>
        <RoomCreateButton/>
        {rooms.map((room) => (<RoomCard key={room.id} room={room}/>))}
    </section>)
}