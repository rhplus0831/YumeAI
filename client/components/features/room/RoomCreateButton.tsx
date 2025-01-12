"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createRoom} from "@/lib/data/Room";

export default function RoomCreateButton() {
    return <CreateWithNameButton dataName={"채팅방"} createSelf={createRoom} />
}