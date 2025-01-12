"use client";

import CreateWithNameButton from "@/components/ui/CreateWithNameButton";
import {createPersona} from "@/lib/data/Persona";

export default function PersonaCreateButton() {
    return <CreateWithNameButton dataName={"페르소나"} createSelf={createPersona} />
}