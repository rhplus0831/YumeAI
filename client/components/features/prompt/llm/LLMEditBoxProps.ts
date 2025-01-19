export default interface LLMEditBoxProps {
    config: Record<string, any>,
    submitConfig: (llm_config: string) => Promise<void>
}