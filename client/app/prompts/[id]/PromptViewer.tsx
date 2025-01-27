"use client";

import YumeMenu from "@/components/MenuPortal";
import {useEffect, useState} from "react";
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
import PromptTestButton from "@/components/features/prompt/PromptTestButton";
import EditablePromptToggleList from "@/components/features/prompt/toggle/EditablePromptToggleList";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";
import GeminiBox from "@/components/features/prompt/llm/GeminiBox";

export default function PromptViewer({startPrompt}: { startPrompt: Prompt }) {
    const [prompt, setPrompt] = useState<Prompt>(startPrompt)
    const [status, setStatus] = useState<string>("normal")
    const router = useRouter()

    async function submitLLMConfig(value: string) {
        setPrompt(await putPrompt(prompt.id, {
            llm_config: value
        }))
    }

    const [config, setConfig] = useState<Record<string, any>>({})

    useEffect(() => {
        try {
            setConfig(JSON.parse(prompt.llm_config))
        } catch {
            setConfig({})
        }
    }, [prompt])

    return <>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-2"}>
                <SubmitSpan value={prompt.name} label={"프롬프트 이름"} submit={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        name: value
                    }))
                }}/>
                <AsyncProgressSelect label={"LLM"} disallowEmptySelection selectedKeys={[prompt.llm]} onValueChangeAsync={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        "llm": value,
                    }))
                }}>
                    <SelectItem key={"openai"}>OpenAI</SelectItem>
                    <SelectItem key={"gemini"}>Gemini</SelectItem>
                </AsyncProgressSelect>
                {prompt.llm == "openai" && <OpenAIBox config={config} submitConfig={submitLLMConfig}/>}
                {prompt.llm == "gemini" && <GeminiBox config={config} submitConfig={submitLLMConfig}/>}
                <AsyncProgressSelect label={"프롬프트 타입"} disallowEmptySelection selectedKeys={[prompt.type]}
                                     onValueChangeAsync={async (value) => {
                                         setPrompt(await putPrompt(prompt.id, {
                                             type: value,
                                         }))
                                     }}>
                    <SelectItem key={"chat"}>채팅</SelectItem>
                    <SelectItem key={"summary"}>요약</SelectItem>
                    <SelectItem key={"re-summary"}>재요약</SelectItem>
                    <SelectItem key={"translate"}>번역</SelectItem>
                    <SelectItem key={"suggest"}>입력 제안</SelectItem>
                </AsyncProgressSelect>
                <AsyncProgressCheckbox isSelected={prompt.use_stream} onValueChangeAsync={async (value) => {
                    setPrompt(await putPrompt(prompt.id, {
                        use_stream: value,
                    }))
                }}>
                    스트리밍 사용
                </AsyncProgressCheckbox>
                <PromptLintButton isDisabled={status !== "normal"} prompt={prompt}/>
                <PromptTestButton prompt={prompt} isDisabled={status !== "normal"}/>
                <EditableFilterList rawFilters={prompt.filters} onEdited={async (filters) => {
                    setPrompt(await putPrompt(prompt.id, {
                        filters: filters,
                    }))
                }}/>
                {prompt.type === 'chat' || prompt.type === 'suggest' &&
                    <EditablePromptToggleList isSuggest={prompt.type === 'suggest'} prompt={prompt}
                                              onEdited={async (toggles) => {
                    setPrompt(await putPrompt(prompt.id, {
                        toggles: toggles,
                    }))
                }}/>}
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