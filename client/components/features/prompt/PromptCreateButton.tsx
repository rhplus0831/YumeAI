"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createPrompt} from "@/lib/data/Prompt";

export default function PromptCreateButton() {
    return <CreateWithNameButton dataName={"프롬프트"} createSelf={createPrompt}/>
}