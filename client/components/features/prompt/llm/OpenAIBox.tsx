import Prompt from "@/lib/data/Prompt";
import {useEffect, useState} from "react";
import OpenAIConfig from "@/lib/data/llm/OpenAIConfig";
import SubmitSpan from "@/components/ui/SubmitSpan";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";

export default function OpenAIBox({prompt, onEdited}: { prompt: Prompt, onEdited: (llm_config: string) => Promise<void> }) {
    const [model, setModel] = useState<string>("")
    const [endpoint, setEndpoint] = useState<string>("")
    const [key, setKey] = useState<string>("")

    const [temperature, setTemperature] = useState("1")
    const [max_tokens, setMax_tokens] = useState("2048")

    const [top_p, setTop_p] = useState("1")
    const [frequency_penalty, setFrequency_penalty] = useState("0")
    const [presence_penalty, setPresence_penalty] = useState("0")

    const getConfig = () => {
        if (!prompt.llm_config) return {
            "endpoint": "",
            "model": "gpt-4o",
            "key": "",
            "temperature": 1,
            "max_tokens": 2048,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0
        } as OpenAIConfig
        return JSON.parse(prompt.llm_config) as OpenAIConfig
    }

    useEffect(() => {
        const config = getConfig()
        if (!config) return
        setModel(config.model)
        setEndpoint(config.endpoint)
        setKey(config.key)
        setTemperature(config.temperature.toString())
        setMax_tokens(config.max_tokens.toString())
        setTop_p(config.top_p.toString())
        setFrequency_penalty(config.frequency_penalty.toString())
        setPresence_penalty(config.presence_penalty.toString())
    }, [prompt])

    return <>
        <SubmitSpan value={model} label={"모델명"} submit={async (value) => {
            const config = getConfig()
            config.model = value
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={endpoint} label={"제공자"} placeholder={"OpenAI"} submit={async (value) => {
            const config = getConfig()
            config.endpoint = value
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={key} label={"API 키"} placeholder={"기본 값"} submit={async (value) => {
            const config = getConfig()
            config.key = value
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={temperature} label={"온도"} submit={async (value) => {
            const config = getConfig()
            config.temperature = parseFloat(value)
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={max_tokens} label={"최대 토큰"} submit={async (value) => {
            const config = getConfig()
            config.max_tokens = parseInt(value)
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={top_p} label={"Top P"} submit={async (value) => {
            const config = getConfig()
            config.top_p = parseFloat(value)
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={frequency_penalty} label={"빈도 패널티"} submit={async (value) => {
            const config = getConfig()
            config.frequency_penalty = parseFloat(value)
            await onEdited(JSON.stringify(config))
        }} />
        <SubmitSpan value={presence_penalty} label={"프레전스 패널티"} submit={async (value) => {
            const config = getConfig()
            config.presence_penalty = parseFloat(value)
            await onEdited(JSON.stringify(config))
        }} />
    </>
}