"use server";

import {getRooms} from "@/lib/data/Room";
import RoomCreateButton from "@/components/features/room/RoomCreateButton";
import NavigateButton from "@/components/ui/NavigateButton";
import RoomBox from "@/components/features/room/RoomBox";
import RoomImportButton from "@/components/features/room/RoomImportButton";

export default async function RoomsPage() {
    const rooms = await getRooms()

    return (<section className={"w-full flex flex-col gap-4"}>
        <RoomCreateButton/>
        <RoomImportButton/>
        {rooms.map((room) => (<NavigateButton href={`/rooms/${room.id}`} key={room.id}>
            <RoomBox room={room}/>
        </NavigateButton>))}
    </section>)
}