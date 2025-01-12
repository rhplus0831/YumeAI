"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createBot} from "@/lib/data/Bot";

export default function BotCreateButton() {
    return <CreateWithNameButton dataName={"봇"} createSelf={createBot}/>
}