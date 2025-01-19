"use client";

import GlobalSettings, {putSingleSetting} from "@/lib/data/GlobalSettings";
import {useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";

export default function SettingsViewer({settings}: { settings: GlobalSettings }) {
    const [openAIAPIKey, setOpenAIAPIKey] = useState<string>(settings.openai_api_key ?? '')
    const [geminiAPIKey, setGeminiAPIKey] = useState<string>(settings.gemini_api_key ?? '')

    return <div className={"flex flex-col gap-4"}>
        <SubmitSpan value={openAIAPIKey} hideOnIdle label={'기본 OpenAI API 키'} submit={async (value) => {
            await putSingleSetting('openai_api_key', value)
            setOpenAIAPIKey(value)
        }}/>
        <SubmitSpan value={geminiAPIKey} hideOnIdle label={'기본 Gemini API 키'} submit={async (value) => {
            await putSingleSetting('gemini_api_key', value)
            setGeminiAPIKey(value)
        }}/>
    </div>
}