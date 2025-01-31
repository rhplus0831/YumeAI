import SelectablePersonaCard from "@/components/features/persona/SelectablePersonaCard";
import {useDisclosure} from "@nextui-org/react";
import Persona from "@/lib/data/Persona";
import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import {PersonaBox} from "@/components/features/persona/PersonaBox";

export default function SelectablePersonaCardWithModal({persona, displayName = "페르소나", endpoint, onSelect}: {
    persona?: Persona,
    displayName?: string
    endpoint?: string,
    onSelect: (persona: Persona) => Promise<void>
}) {
    const disclosure = useDisclosure()

    return (<>
        <SelectablePersonaCard persona={persona} onSelect={async () => {
            disclosure.onOpen()
        }}/>
        <BaseSelectModal disclosure={disclosure} displayName={displayName} endpoint={endpoint}
                         onSelect={async (persona: Persona) => {
                             await onSelect(persona)
                             disclosure.onClose()
                         }} generateBox={(persona: Persona) => (<PersonaBox persona={persona}/>)}/>
    </>)
}