import {api} from "@/lib/api-client";

export default interface GlobalSettings {
    openai_api_key?: string
    gemini_api_key?: string

    max_re_summary_count?: string,
    max_summary_count?: string,
    max_conversation_count?: string,
    storage_usage: string,
}

export async function getGlobalSettings() {
    return await api('settings', {
        method: 'GET'
    })
}

export async function putSingleSetting(key: string, value: string) {
    return await api(`settings`, {
        method: "PUT",
        body: JSON.stringify({
            [key]: value
        })
    })
}