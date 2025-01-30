"use client";

import {importBotFromFile} from "@/lib/data/bot/Bot";
import ImportButton from "@/components/features/ImportButton";

export default function BotImportButton() {
    return <ImportButton mime={"*"} importer={importBotFromFile} label={"봇 불러오기"}/>
}