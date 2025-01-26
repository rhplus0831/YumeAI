"use client";

import {importBotFromZip} from "@/lib/data/bot/Bot";
import ImportButton from "@/components/features/ImportButton";

export default function BotImportButton() {
    return <ImportButton mime={".charx"} importer={importBotFromZip} label={"봇 불러오기"}/>
}