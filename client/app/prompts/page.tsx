"use server";

import NavigateButton from "@/components/ui/NavigateButton";
import {getPrompts} from "@/lib/data/Prompt";
import PromptBox from "@/components/features/prompt/PromptBox";
import PromptCreateButton from "@/components/features/prompt/PromptCreateButton";

export default async function PersonasPage() {
    const personas = await getPrompts()

    return (<section className={"w-full flex flex-col gap-4"}>
        <PromptCreateButton/>
        {personas.map((prompt) => (<NavigateButton href={`/prompts/${prompt.id}`} key={prompt.id}>
            <PromptBox prompt={prompt}/>
        </NavigateButton>))}
    </section>)
}