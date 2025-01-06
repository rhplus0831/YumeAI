export default interface OpenAIConfig {
    endpoint: string
    model: string
    key: string

    temperature: number
    max_tokens: number
    top_p: number
    frequency_penalty: number
    presence_penalty: number
}