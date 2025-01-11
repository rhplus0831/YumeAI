import SelectablePersonaCard from "@/components/features/persona/SelectablePersonaCard";
import {useState} from "react";
import {useDisclosure} from "@nextui-org/react";
import Persona from "@/lib/data/Persona";
import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import {PersonaBox} from "@/components/features/persona/PersonaBox";

export default function SelectablePersonaCardWithModal({persona, displayName = "페르소나", fetchPersona, onSelect}: {
    persona?: Persona,
    displayName?: string
    fetchPersona: () => Promise<Persona[]>,
    onSelect: (persona: Persona) => Promise<void>
}) {
    const disclosure = useDisclosure()
    const [personas, setPersonas] = useState<Persona[]>([])

    return (<>
        <SelectablePersonaCard persona={persona} onSelect={async () => {
            setPersonas(await fetchPersona())
            disclosure.onOpen()
        }}/>
        <BaseSelectModal disclosure={disclosure} displayName={displayName} datas={personas}
                         onSelect={async (persona) => {
                             await onSelect(persona)
                             disclosure.onClose()
                         }} generateBox={(persona) => (<PersonaBox persona={persona}/>)}/>
    </>)
}