"use client";

import BaseSelectableCard from "@/components/ui/base/BaseSelectableCard";
import Prompt from "@/lib/data/Prompt";
import PromptBox from "@/components/features/prompt/PromptBox";

export default function SelectablePromptCard({prompt, onSelect}: {
    prompt?: Prompt,
    onSelect: () => Promise<void>
}) {
    return <BaseSelectableCard onSelect={onSelect} data={prompt}
                               generateBox={prompt => <PromptBox prompt={prompt}/>}/>
}