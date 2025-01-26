"use server";

import {getRooms} from "@/lib/data/Room";
import RoomCreateButton from "@/components/features/room/RoomCreateButton";
import NavigateButton from "@/components/ui/NavigateButton";
import RoomBox from "@/components/features/room/RoomBox";
import YumeImportButton from "@/components/features/room/YumeImportButton";

export default async function RoomsPage() {
    const rooms = await getRooms()

    return (<section className={"w-full flex flex-col gap-4"}>
        <RoomCreateButton/>
        <YumeImportButton/>
        {rooms.map((room) => (<NavigateButton href={`/rooms/${room.id}`} key={room.id}>
            <RoomBox room={room}/>
        </NavigateButton>))}
    </section>)
}