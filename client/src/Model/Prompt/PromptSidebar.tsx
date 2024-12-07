import React from "react";
import {Divider, Grid, GridItem, IconButton, Select, Text} from "@chakra-ui/react";
import Prompt from "./Prompt.ts";
import {getAPIServer} from "../../Configure";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import {ArrowBackIcon} from "@chakra-ui/icons";
import SendingAlert from "../../Base/SendingAlert/SendingAlert.tsx";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert.ts";
import OpenAIBox from "./LLMBox/OpenAIBox.tsx";
import FilterList from "../Filter/FilterList.tsx";

export default function PromptSidebar({selectedPrompt, setSelectedPrompt, onEdited}: {
    selectedPrompt: Prompt | null,
    setSelectedPrompt: (persona: Prompt | null) => void,
    onEdited: (data: Prompt) => void
}) {
    const [name, setName] = React.useState("");
    const [model, setModel] = React.useState("");

    React.useEffect(() => {
        if (selectedPrompt === null) return

        setName(selectedPrompt.name)
        setModel(selectedPrompt.llm)
    }, [selectedPrompt])

    const sendingAlertProp = useSendingAlert()

    return (
        <Grid display={selectedPrompt !== null ? "grid" : "none"} templateRows={'auto auto auto auto'}>
            <GridItem>
                <IconButton aria-label={'Back'} icon={<ArrowBackIcon></ArrowBackIcon>} onClick={() => {
                    setSelectedPrompt(null)
                }}></IconButton>
                <Text>프롬프트 이름</Text>
                <AutoSubmitEditable
                    endpoint={selectedPrompt !== null ? getAPIServer() + 'prompt/' + selectedPrompt.id : ''}
                    valueName={'name'} value={name} setValue={setName} onEdited={onEdited}></AutoSubmitEditable>
                <SendingAlert {...sendingAlertProp} />
                <Divider marginY={"0.6em"}/>
                <Text>사용할 LLM</Text>
                <Select value={model} onChange={async (event) => {
                    const prompt: Prompt = await notifyFetch(getAPIServer() + `prompt/${selectedPrompt?.id}`, sendingAlertProp, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'llm': event.target.value,
                            'llm_config': ''
                        })
                    }, 'LLM 제공자를 변경하는중...')
                    onEdited(prompt)
                    setModel(prompt.llm)
                }}>
                    <option value='openai'>OpenAI</option>
                    <option value='claude'>Calude</option>
                </Select>
                <Divider marginY={"0.6em"}/>
                {selectedPrompt?.llm === "openai" ?
                    <OpenAIBox selectedPrompt={selectedPrompt} onEdited={onEdited}/> : ""}
                <Divider marginY={"0.6em"}/>
                <Text>필터</Text>
                {selectedPrompt ? <FilterList onEdited={async (data: string) => {
                    const prompt: Prompt = await notifyFetch(getAPIServer() + `prompt/${selectedPrompt?.id}`, sendingAlertProp, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            'filters': data
                        })
                    }, '필터 정보를 업데이트 하는중...')
                    onEdited(prompt)
                }} filters_raw={selectedPrompt.filters ? selectedPrompt.filters : ""}/> : ""}
            </GridItem>
        </Grid>
    )
}