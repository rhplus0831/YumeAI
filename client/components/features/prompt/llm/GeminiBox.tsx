import Prompt from "@/lib/data/Prompt";
import {useEffect, useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import GeminiConfig from "@/lib/data/llm/GeminiConfig";

export default function GeminiBox({prompt, onEdited}: {
    prompt: Prompt,
    onEdited: (llm_config: string) => Promise<void>
}) {
    const [model, setModel] = useState<string>("")
    const [key, setKey] = useState<string>("")

    const getConfig = () => {
        if (!prompt.llm_config) return {
            "model": "gemini-1.5-pro",
            "key": "",
        } as GeminiConfig
        return JSON.parse(prompt.llm_config) as GeminiConfig
    }

    useEffect(() => {
        const config = getConfig()
        if (!config) return
        setModel(config.model)
        setKey(config.key)
    }, [prompt])

    return <>
        <SubmitSpan value={model} label={"모델명"} submit={async () => {
            const config = getConfig()
            config.model = model
            await onEdited(JSON.stringify(config))
        }}/>
        <SubmitSpan value={key} label={"API 키"} placeholder={"기본 값"} submit={async () => {
            const config = getConfig()
            config.key = key
            await onEdited(JSON.stringify(config))
        }}/>
    </>
}