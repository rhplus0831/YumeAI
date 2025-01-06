"use client";

import Room from "@/lib/data/Room";
import {AvatarGroup, Button} from "@nextui-org/react";
import {buildImageLink} from "@/lib/api-client";
import YumeAvatar from "@/components/ui/YumeAvatar";
import {useRouter} from "next/navigation";

export default function RoomCard({room}: { room: Room }) {
    const router = useRouter()

    return (<Button size={"lg"} className={"w-full h-14"} onPress={() => {
        router.push(`/rooms/${room.id}`)
    }}>
        <div className={"w-full flex flex-row items-center gap-4"}>
            <AvatarGroup>
                <YumeAvatar src={buildImageLink(room.bot?.profileImageId)}/>
                <YumeAvatar src={buildImageLink(room.persona?.profileImageId)}/>
            </AvatarGroup>
            <span>{room.name}</span>
        </div>
    </Button>)
}