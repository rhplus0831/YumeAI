import BaseLLMConfig from "@/lib/data/llm/BaseLLMConfig";

export default interface OpenAIConfig extends BaseLLMConfig {
    endpoint: string
    top_p: number
    frequency_penalty: number
    presence_penalty: number
}