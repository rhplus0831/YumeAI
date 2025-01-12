"use client";

import YumeMenu from "@/components/MenuPortal";
import {useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import PromptTextarea from "@/components/ui/PromptTextarea";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import Prompt, {deletePrompt, putPrompt} from "@/lib/data/Prompt";
import AsyncProgressSelect from "@/components/ui/AsyncProgressSelect";
import {SelectItem} from "@nextui-org/react";
import PromptLintButton from "@/components/features/prompt/PromptLintButton";
import EditableFilterList from "@/components/features/filter/EditableFilterList";
import OpenAIBox from "@/components/features/prompt/llm/OpenAIBox";
import GeminiBox from "@/components/features/prompt/llm/GeminiBox";

export default function PromptViewer({startPrompt}: { startPrompt: Prompt }) {
    const [prompt, setPrompt] = useState<Prompt>(startPrompt)
    const [status, setStatus] = useState<string>("normal")
    const router = useRouter()

    async function onLLMConfigChange(value: string) {
        setPrompt( await putPrompt(prompt.id, {
            llm_config: value
        }) )
    }

    return <>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-2"}>
                <SubmitSpan value={prompt.name} label={"프롬프트 이름"} submit={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        name: value
                    }))
                }}/>
                <AsyncProgressSelect label={"LLM"} selectedKeys={[prompt.llm]} onValueChangeAsync={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        "llm": value,
                        "llm_config":''
                    }))
                }}>
                    <SelectItem key={"openai"}>OpenAI</SelectItem>
                    <SelectItem key={"gemini"}>Gemini</SelectItem>
                </AsyncProgressSelect>
                {prompt.llm == "openai" && <OpenAIBox prompt={prompt} onEdited={onLLMConfigChange} />}
                {prompt.llm == "gemini" && <GeminiBox prompt={prompt} onEdited={onLLMConfigChange} />}
                <AsyncProgressSelect label={"프롬프트 타입"} selectedKeys={[prompt.type]} onValueChangeAsync={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        type: value,
                    }))
                }}>
                    <SelectItem key={"chat"}>채팅</SelectItem>
                    <SelectItem key={"summary"}>요약</SelectItem>
                    <SelectItem key={"re-summary"}>재요약</SelectItem>
                    <SelectItem key={"translate"}>번역</SelectItem>
                </AsyncProgressSelect>
                <PromptLintButton isDisabled={status !== "normal"} prompt={prompt}/>
                <EditableFilterList rawFilters={prompt.filters} onEdited={async (filters) => {
                    setPrompt(await putPrompt(prompt.id, {
                        filters: filters,
                    }))
                }} />
                <DeleteConfirmButton className={"mt-10"} confirmCount={3} onConfirmed={async () => {
                    await deletePrompt(prompt.id)
                    router.replace("/prompts")
                }}/>
            </div>
        </YumeMenu>
        <PromptTextarea title={"프롬프트"} setStatus={setStatus} prompt={prompt.prompt} onSave={async (text) => {
            setPrompt(await putPrompt(prompt.id, {
                prompt: text
            }))
        }}/>
    </>
}