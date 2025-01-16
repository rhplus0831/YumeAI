import {useState} from "react";
import {Checkbox, useDisclosure} from "@nextui-org/react";
import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import SelectablePromptCard from "@/components/features/prompt/SelectablePromptCard";
import Prompt, {getPrompts} from "@/lib/data/Prompt";
import PromptBox from "@/components/features/prompt/PromptBox";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";

export default function SelectablePromptCardWithModal({prompt, displayName = "프롬프트", filterType = "all", onSelect}: {
    prompt?: Prompt,
    displayName?: string,
    filterType?: string,
    onSelect: (persona: Prompt) => Promise<void>
}) {
    const disclosure = useDisclosure()
    const [useAll, setUseAll] = useState(false)
    const [prompts, setPrompts] = useState<Prompt[]>([])

    return (<>
        <SelectablePromptCard prompt={prompt} onSelect={async () => {
            setUseAll(false)
            setPrompts(await getPrompts(filterType))
            disclosure.onOpen()
        }}/>
        <BaseSelectModal disclosure={disclosure} displayName={displayName} datas={prompts}
                         onSelect={async (prompt) => {
                             await onSelect(prompt)
                             disclosure.onClose()
                         }} generateBox={(prompt) => (<PromptBox prompt={prompt}/>)}
                         extraFooter={<AsyncProgressCheckbox isSelected={useAll} onValueChangeAsync={async (value) => {
                             setUseAll(value)
                             setPrompts(await getPrompts(value ? "all" : filterType))
                         }}>
                             모든 프롬프트 보기
                         </AsyncProgressCheckbox>}/>
    </>)
}