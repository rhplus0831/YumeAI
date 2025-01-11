"use client";

import Persona from "@/lib/data/Persona";
import BaseSelectableCard from "@/components/ui/base/BaseSelectableCard";
import {PersonaBox} from "@/components/features/persona/PersonaBox";

export default function SelectablePersonaCard({persona, onSelect}: {
    persona?: Persona,
    onSelect: () => Promise<void>
}) {
    return <BaseSelectableCard onSelect={onSelect} data={persona}
                               generateBox={persona => <PersonaBox persona={persona}/>}/>
}