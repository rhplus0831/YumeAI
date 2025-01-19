import SubmitLLMConfigSpan from "@/components/features/prompt/llm/SubmitLLMConfigSpan";
import LLMEditBoxProps from "@/components/features/prompt/llm/LLMEditBoxProps";
import {AutocompleteItem, AutocompleteSection} from "@nextui-org/react";

//Reference: https://platform.openai.com/docs/api-reference/chat/object

export default function OpenAIBox(props: LLMEditBoxProps) {
    const {config, submitConfig} = props

    return <>
        <SubmitLLMConfigSpan config={config} configKey={'key'} hideOnIdle placeholder={'기본 값'} defaultValue={''}
                             submitConfig={submitConfig} label={'API 키'}/>
        <SubmitLLMConfigSpan config={config} configKey={'endpoint'} placeholder={'OpenAI'} defaultValue={''}
                             submitConfig={submitConfig} label={'엔드포인트'}/>
        <SubmitLLMConfigSpan config={config} configKey={'model'} placeholder={'gpt-4o'} submitConfig={submitConfig}
                             label={'모델'} autoComplete={<>
            <AutocompleteSection showDivider title="권장 모델">
                <AutocompleteItem key="gpt-4o">gpt-4o</AutocompleteItem>
                <AutocompleteItem key="gpt-4o-mini">gpt-4o-mini</AutocompleteItem>
            </AutocompleteSection>
            <AutocompleteSection showDivider title={"GPT 4o and mini"}>
                <AutocompleteItem key="gpt-4o-2024-11-20">gpt-4o-2024-11-20</AutocompleteItem>
                <AutocompleteItem key="gpt-4o-2024-08-06">gpt-4o-2024-08-06</AutocompleteItem>
                <AutocompleteItem key="gpt-4o-2024-05-13">gpt-4o-2024-05-13</AutocompleteItem>
                <AutocompleteItem key="chatgpt-4o-latest">chatgpt-4o-latest</AutocompleteItem>
                <AutocompleteItem key="gpt-4o-mini-2024-07-18">gpt-4o-mini-2024-07-18</AutocompleteItem>
            </AutocompleteSection>
            <AutocompleteSection showDivider title={"비권장: o1 and mini"}>
                <AutocompleteItem key="o1">o1</AutocompleteItem>
                <AutocompleteItem key="o1-2024-12-17">o1-2024-12-17</AutocompleteItem>
                <AutocompleteItem key="o1-mini">o1-mini</AutocompleteItem>
                <AutocompleteItem key="o1-mini-2024-09-12">o1-mini-2024-09-12</AutocompleteItem>
                <AutocompleteItem key="o1-preview">o1-preview</AutocompleteItem>
                <AutocompleteItem key="o1-preview-2024-09-12">o1-preview-2024-09-12</AutocompleteItem>
            </AutocompleteSection>
            <AutocompleteSection showDivider title={"비권장: GPT-4 and Turbo"}>
                <AutocompleteItem key="gpt-4-turbo">gpt-4-turbo</AutocompleteItem>
                <AutocompleteItem key="gpt-4-turbo-2024-04-09">gpt-4-turbo-2024-04-09</AutocompleteItem>
                <AutocompleteItem key="gpt-4-turbo-preview">gpt-4-turbo-preview</AutocompleteItem>
                <AutocompleteItem key="gpt-4-0125-preview">gpt-4-0125-preview</AutocompleteItem>
                <AutocompleteItem key="gpt-4-1106-preview">gpt-4-1106-preview</AutocompleteItem>
                <AutocompleteItem key="gpt-4">gpt-4</AutocompleteItem>
                <AutocompleteItem key="gpt-4-0613">gpt-4-0613</AutocompleteItem>
                <AutocompleteItem key="gpt-4-0314">gpt-4-0314</AutocompleteItem>
            </AutocompleteSection>
            <AutocompleteSection showDivider title={"비권장: GPT-3.5 Turbo"}>
                <AutocompleteItem key="gpt-3.5-turbo-0125">gpt-3.5-turbo-0125</AutocompleteItem>
                <AutocompleteItem key="gpt-3.5-turbo">gpt-3.5-turbo</AutocompleteItem>
                <AutocompleteItem key="gpt-3.5-turbo-1106">gpt-3.5-turbo-1106</AutocompleteItem>
                <AutocompleteItem key="gpt-3.5-turbo-instruct">gpt-3.5-turbo-instruct</AutocompleteItem>
            </AutocompleteSection>
        </>}/>
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