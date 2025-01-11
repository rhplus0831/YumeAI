import Prompt from "@/lib/data/Prompt";

export default function PromptBox({prompt}: { prompt: Prompt }) {
    return (
        <div className={"flex-1 flex flex-row items-center gap-4"}>
            <span>{prompt.name}</span>
        </div>
    )
}