import {api} from "@/lib/api-client";

export default interface GlobalSettings {
    openai_api_key?: string
    gemini_api_key?: string
}

export async function putSingleSetting(key: string, value: string) {
    return await api(`settings`, {
        method: "PUT",
        body: JSON.stringify({
            [key]: value
        })
    })
}