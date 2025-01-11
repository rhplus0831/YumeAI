import BaseData from "@/lib/data/BaseData";
import {api} from "@/lib/api-client";

export default interface Prompt extends BaseData {
    name: string
    prompt: string
    type: string
    llm: string
    llm_config: string
    filters: string | null
}

export async function getPrompts(type: string = "all"): Promise<Prompt[]> {
    return await api(`prompt/?type=${type}`, {
        method: 'GET'
    })
}