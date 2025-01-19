import SubmitLLMConfigSpan from "@/components/features/prompt/llm/SubmitLLMConfigSpan";
import LLMEditBoxProps from "@/components/features/prompt/llm/LLMEditBoxProps";

//Reference: https://platform.openai.com/docs/api-reference/chat/object

export default function OpenAIBox(props: LLMEditBoxProps) {
    const {config, submitConfig} = props

    return <>
        <SubmitLLMConfigSpan config={config} configKey={'key'} hideOnIdle placeholder={'기본 값'} defaultValue={''}
                             submitConfig={submitConfig} label={'API 키'}/>
        <SubmitLLMConfigSpan config={config} configKey={'endpoint'} placeholder={'OpenAI'} defaultValue={''}
                             submitConfig={submitConfig} label={'엔드포인트'}/>
        <SubmitLLMConfigSpan config={config} configKey={'model'} placeholder={'gpt-4o'} submitConfig={submitConfig}
                             label={'모델'}/>
        <SubmitLLMConfigSpan config={config} configKey={'max_input'} enforceInteger
                             enforceNumberRange={[1, Number.MAX_VALUE]} placeholder={'제한 없음'} defaultValue={''}
                             submitConfig={submitConfig} label={'최대 입력 토큰'}/>
        <SubmitLLMConfigSpan config={config} configKey={'max_output'} enforceInteger
                             enforceNumberRange={[1, Number.MAX_VALUE]} placeholder={'제한 없음'} defaultValue={''}
                             submitConfig={submitConfig} label={'최대 출력 토큰'}/>

        <SubmitLLMConfigSpan config={config} configKey={'presence_penalty'} enforceNumber enforceNumberRange={[-2, 2]}
                             placeholder={'0'} submitConfig={submitConfig} label={'프레전스 패널티'}/>
        <SubmitLLMConfigSpan config={config} configKey={'frequency_penalty'} enforceNumber enforceNumberRange={[-2, 2]}
                             placeholder={'0'} submitConfig={submitConfig} label={'빈도 패널티'}/>
        <SubmitLLMConfigSpan config={config} configKey={'temperature'} enforceNumber enforceNumberRange={[0, 2]}
                             placeholder={'1'} submitConfig={submitConfig} label={'온도'}/>
        <SubmitLLMConfigSpan config={config} configKey={'top_p'} enforceNumber enforceNumberRange={[0, 1]}
                             placeholder={'1'} submitConfig={submitConfig} label={'Top P'}/>

        {/*TODO: Support n, logit_bias*/}
    </>
}