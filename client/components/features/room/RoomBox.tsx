"use client";

import {AvatarGroup} from "@nextui-org/react";
import YumeAvatar from "@/components/ui/YumeAvatar";
import Room from "@/lib/data/Room";
import {buildImageLink} from "@/lib/data/Image";

export default function RoomBox({room}: {room: Room}) {
    return (<div className={"w-full flex flex-row items-center gap-4"}>
        <AvatarGroup>
            <YumeAvatar src={buildImageLink(room.bot?.profileImageId, "avatar")}/>
            <YumeAvatar src={buildImageLink(room.persona?.profileImageId, "avatar")}/>
        </AvatarGroup>
        <span>{room.name}</span>
    </div>)
}