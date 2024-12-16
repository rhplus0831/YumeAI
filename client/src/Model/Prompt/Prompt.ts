import BaseData from "../Base/BaseData.ts";

export default interface Prompt extends BaseData {
    name: string
    prompt: string
    type: string
    llm: string
    llm_config: string
    filters: string | null
}