import BaseLLMConfig from "@/lib/data/llm/BaseLLMConfig";

export default interface GeminiConfig extends BaseLLMConfig {
    model: string
    key: string
}