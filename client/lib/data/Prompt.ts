import BaseData from "@/lib/data/BaseData";
import {api} from "@/lib/api-client";

export default interface Prompt extends BaseData {
    name: string
    prompt: string
    type: string
    llm: string
    llm_config: string
    use_stream: boolean
    filters: string | null
    toggles: string | null
}

export interface PromptLint {
    check: string
    message: string[]
}

export interface TestPrompt {
    message: string
}

type PartialPrompt = Partial<Prompt>;

export async function getPrompts(type: string = "all"): Promise<Prompt[]> {
    return await api(`prompt/?type=${type}`, {
        method: 'GET'
    })
}

export async function getPrompt(id: string): Promise<Prompt> {
    return await api(`prompt/${id}`, {
        method: 'GET'
    })
}

export async function lintPrompt(id: string): Promise<PromptLint> {
    return await api(`prompt/${id}/lint`, {
        method: 'POST'
    })
}

export async function testPrompt(id: string, active_toggles: string): Promise<TestPrompt> {
    return await api(`prompt/${id}/test`, {
        method: 'POST',
        body: JSON.stringify({
            'active_toggles': active_toggles,
        })
    })
}

export async function createPrompt(name: string): Promise<Prompt> {
    return await api('prompt', {
        method: 'POST',
        body: JSON.stringify({
            "name": name,
            "prompt": "",
            "type": "chat",
            "llm": "openai",
            "llm_config": "",
        })
    })
}

export async function putPrompt(id: string, data: PartialPrompt): Promise<Prompt> {
    return await api(`prompt/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deletePrompt(id: string): Promise<void> {
    return await api(`prompt/${id}`, {
        method: 'DELETE'
    })
}