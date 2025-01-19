import SubmitLLMConfigSpan from "@/components/features/prompt/llm/SubmitLLMConfigSpan";
import LLMEditBoxProps from "@/components/features/prompt/llm/LLMEditBoxProps";
import {AutocompleteItem, AutocompleteSection} from "@nextui-org/react";

//Reference: https://platform.openai.com/docs/api-reference/chat/object

export default function GeminiBox(props: LLMEditBoxProps) {
    const {config, submitConfig} = props

    return <>
        <SubmitLLMConfigSpan config={config} configKey={'key'} hideOnIdle placeholder={'기본 값'} defaultValue={''}
                             submitConfig={submitConfig} label={'API 키'}/>
        <SubmitLLMConfigSpan config={config} configKey={'model'} placeholder={'gemini-1.5-pro'} submitConfig={submitConfig}
                             label={'모델'} autoComplete={<>
            <AutocompleteSection showDivider title="권장 모델">
                <AutocompleteItem key="gemini-2.0-flash-exp">gemini-2.0-flash-exp</AutocompleteItem>
                <AutocompleteItem key="gemini-2.0-flash-thinking-exp">gemini-2.0-flash-thinking-exp</AutocompleteItem>
                <AutocompleteItem key="gemini-exp-1206">gemini-exp-1206</AutocompleteItem>
                <AutocompleteItem key="gemini-1.5-pro">gemini-1.5-pro</AutocompleteItem>
                <AutocompleteItem key="gemini-1.5-flash">gemini-1.5-flash</AutocompleteItem>
            </AutocompleteSection>
            <AutocompleteItem key="gemini-1.5-flash-8b">gemini-1.5-flash-8b</AutocompleteItem>
            <AutocompleteItem key="gemini-1.0-pro">gemini-1.0-pro</AutocompleteItem>
        </>}/>
        <SubmitLLMConfigSpan config={config} configKey={'max_input'} enforceInteger
                             enforceNumberRange={[1, Number.MAX_VALUE]} placeholder={'제한 없음'} defaultValue={''}
                             submitConfig={submitConfig} label={'최대 입력 토큰'}/>
        <SubmitLLMConfigSpan config={config} configKey={'max_output'} enforceInteger
                             enforceNumberRange={[1, Number.MAX_VALUE]} placeholder={'제한 없음'} defaultValue={''}
                             submitConfig={submitConfig} label={'최대 출력 토큰'}/>

        <SubmitLLMConfigSpan config={config} configKey={'temperature'} placeholder={'모델 기본값'} enforceNumber enforceNumberRange={[0, 2]} submitConfig={submitConfig} label={'온도'} />
        <SubmitLLMConfigSpan config={config} configKey={'top_p'} placeholder={'모델 기본값'} enforceNumber enforceNumberRange={[0, 1]} submitConfig={submitConfig} label={'Top P'} />
        <SubmitLLMConfigSpan config={config} configKey={'top_k'} placeholder={'모델 기본값'} enforceInteger enforceNumberRange={[1, Number.MAX_VALUE]} submitConfig={submitConfig} label={'Top K'} />

        <SubmitLLMConfigSpan config={config} configKey={'presence_penalty'} enforceNumber enforceNumberRange={[-2, 2]}
                             placeholder={'0'} submitConfig={submitConfig} label={'프레전스 패널티'}/>
        <SubmitLLMConfigSpan config={config} configKey={'frequency_penalty'} enforceNumber enforceNumberRange={[-2, 2]}
                             placeholder={'0'} submitConfig={submitConfig} label={'빈도 패널티'}/>
    </>
}