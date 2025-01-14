import {Select, SelectItem} from "@nextui-org/react";
import Prompt from "@/lib/data/Prompt";

export default function PromptToggleSelect({prompt, setCheckedToggles}: {prompt: Prompt, setCheckedToggles: (selection: string) => void}) {
    return <Select selectionMode="multiple" size={"sm"} label={"사용하는 토글"} onChange={(event) => {
        setCheckedToggles( event.target.value )
    }}>
        {prompt.toggles ? prompt.toggles.split("\n").map((toggle) => {
            const [name, display] = toggle.split("=")

            return <SelectItem key={name}>{display}</SelectItem>
        }) : <></>}
    </Select>
}