"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createBot} from "@/lib/data/bot/Bot";

export default function BotCreateButton() {
    return <CreateWithNameButton dataName={"봇"} createSelf={createBot}/>
}