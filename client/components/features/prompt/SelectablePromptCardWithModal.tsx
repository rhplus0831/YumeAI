import {useState} from "react";
import {useDisclosure} from "@nextui-org/react";
import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import SelectablePromptCard from "@/components/features/prompt/SelectablePromptCard";
import Prompt from "@/lib/data/Prompt";
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

    return (<>
        <SelectablePromptCard prompt={prompt} onSelect={async () => {
            disclosure.onOpen()
        }}/>
        <BaseSelectModal disclosure={disclosure} displayName={displayName}
                         endpoint={`prompt?type=${useAll ? "all" : filterType}&`}
                         onSelect={async (prompt: Prompt) => {
                             await onSelect(prompt)
                             disclosure.onClose()
                         }} generateBox={(prompt: Prompt) => (<PromptBox prompt={prompt}/>)}
                         extraFooter={<>
                             <AsyncProgressCheckbox isSelected={useAll} onValueChangeAsync={async (value) => {
                             setUseAll(value)
                         }}>
                             모든 프롬프트 보기
                             </AsyncProgressCheckbox>
                         </>}/>
    </>)
}