import {Box, Text} from "@chakra-ui/react";
import AutoSubmitEditable from "../../Base/AutoSubmitEditable.tsx";
import Prompt from "../Prompt.ts";
import {useEffect, useState} from "react";
import {getAPIServer} from "../../../Configure.ts";
import OpenAIConfig from "./OpenAIConfig.ts";

export default function OpenAIBox({selectedPrompt, onEdited}: {
    selectedPrompt: Prompt | null,
    onEdited: (data: Prompt) => void
}) {
    const [model, setModel] = useState<string>("")
    const [endpoint, setEndpoint] = useState<string>("")
    const [key, setKey] = useState<string>("")

    const getConfig = () => {
        if (!selectedPrompt) return undefined;
        if (!selectedPrompt.llm_config) return {
            "endpoint": "",
            "model": "gpt-4o",
            "key": ""
        } as OpenAIConfig
        return JSON.parse(selectedPrompt.llm_config) as OpenAIConfig
    }

    useEffect(() => {
        const config = getConfig()
        if (!config) return
        setModel(config.model)
        setEndpoint(config.endpoint)
        setKey(config.key)
    }, [selectedPrompt])

    return (
        <Box>
            <Text>사용할 모델</Text>
            <AutoSubmitEditable endpoint={selectedPrompt ? getAPIServer() + `prompt/${selectedPrompt.id}` : ''}
                                valueName={''} customData={() => {
                const config = getConfig()
                if (!config) return undefined
                config.model = model
                return {
                    "llm_config": JSON.stringify(config)
                }
            }} value={model} setValue={setModel} onEdited={onEdited}/>
            <Text>커스텀 제공자</Text>
            <Text fontSize={"sm"}>비워두면 OpenAI가 사용됩니다.</Text>
            <AutoSubmitEditable endpoint={selectedPrompt ? getAPIServer() + `prompt/${selectedPrompt.id}` : ''}
                                valueName={''} customData={() => {
                const config = getConfig()
                if (!config) return undefined
                config.endpoint = endpoint
                return {
                    "llm_config": JSON.stringify(config)
                }
            }} value={endpoint} setValue={setEndpoint} onEdited={onEdited}/>
            <Text>API 키</Text>
            <Text fontSize={"sm"}>비워두면 기본으로 설정된 키가 사용됩니다.</Text>
            <AutoSubmitEditable endpoint={selectedPrompt ? getAPIServer() + `prompt/${selectedPrompt.id}` : ''}
                                valueName={''} customData={() => {
                const config = getConfig()
                if (!config) return undefined
                config.key = key
                return {
                    "llm_config": JSON.stringify(config)
                }
            }} value={key} setValue={setKey} onEdited={onEdited}/>
        </Box>
    )
}