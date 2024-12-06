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

    const getConfig = () => {
        if (!selectedPrompt) return undefined;
        if(!selectedPrompt.llm_config) return {
            "endpoint": "",
            "model": "gpt-4o",
            "key": ""
        } as OpenAIConfig
        return JSON.parse(selectedPrompt.llm_config) as OpenAIConfig
    }

    useEffect(() => {
        const config = getConfig()
        if(!config) return
        setModel(config.model)
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
        </Box>
    )
}