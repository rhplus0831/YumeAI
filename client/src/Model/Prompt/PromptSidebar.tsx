import React from "react";
import {
    Button, Card, CardBody,
    Divider,
    Grid,
    GridItem,
    IconButton, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay,
    Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader,
    PopoverTrigger,
    Select, Stack, StackDivider,
    Text,
    useDisclosure
} from "@chakra-ui/react";
import Prompt from "./Prompt.ts";
import {getAPIServer} from "../../Configure";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import {ArrowBackIcon} from "@chakra-ui/icons";
import SendingAlert from "../../Base/SendingAlert/SendingAlert.tsx";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert.ts";
import OpenAIBox from "./LLMBox/OpenAIBox.tsx";
import FilterList from "../Filter/FilterList.tsx";
import GeminiBox from "./LLMBox/GeminiBox.tsx";
import PromptLint from "./LLMBox/PromptLint.ts";

export default function PromptSidebar({selectedPrompt, setSelectedPrompt, onEdited}: {
    selectedPrompt: Prompt | null,
    setSelectedPrompt: (persona: Prompt | null) => void,
    onEdited: (data: Prompt) => void
}) {
    const [name, setName] = React.useState("");
    const [model, setModel] = React.useState("");
    const [type, setType] = React.useState("");

    React.useEffect(() => {
        if (selectedPrompt === null) return

        setName(selectedPrompt.name)
        setModel(selectedPrompt.llm)
        setType(selectedPrompt.type)
    }, [selectedPrompt])

    const sendingAlertProp = useSendingAlert()
    const lintPopoverProp = useDisclosure()
    const [lintModalMessage, setLintModalMessage] = React.useState<string[]>([])
    const lintModalProp = useDisclosure()

    return (
        <>
            <Grid display={selectedPrompt !== null ? "grid" : "none"} templateRows={'auto auto auto auto'}>
                <GridItem>
                    <IconButton aria-label={'Back'} icon={<ArrowBackIcon></ArrowBackIcon>} onClick={() => {
                        setSelectedPrompt(null)
                    }}></IconButton>
                    <SendingAlert {...sendingAlertProp} />
                    <Text>프롬프트 이름</Text>
                    <AutoSubmitEditable
                        endpoint={selectedPrompt !== null ? getAPIServer() + 'prompt/' + selectedPrompt.id : ''}
                        valueName={'name'} value={name} setValue={setName} onEdited={onEdited}></AutoSubmitEditable>
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
                        <option value='gemini'>Gemini</option>
                        <option value='claude'>Calude</option>
                    </Select>
                    <Divider marginY={"0.6em"}/>
                    {selectedPrompt?.llm === "openai" ?
                        <OpenAIBox selectedPrompt={selectedPrompt} onEdited={onEdited}/> : ""}
                    {selectedPrompt?.llm === "gemini" ?
                        <GeminiBox selectedPrompt={selectedPrompt} onEdited={onEdited}/> : ""}
                    <Divider marginY={"0.6em"}/>
                    <Text>프롬프트 타입</Text>
                    <Select value={type} onChange={async (event) => {
                        const prompt: Prompt = await notifyFetch(getAPIServer() + `prompt/${selectedPrompt?.id}`, sendingAlertProp, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                'type': event.target.value
                            })
                        }, '프롬프트 타입을 변경하는중...')
                        onEdited(prompt)
                        setType(prompt.type)
                    }}>
                        <option value='chat'>채팅</option>
                        <option value='summary'>요약</option>
                        <option value='re-summary'>재요약</option>
                        <option value='translate'>번역</option>
                    </Select>
                    <Divider marginY={"0.6em"}/>
                    <Popover isOpen={lintPopoverProp.isOpen} onClose={lintPopoverProp.onClose}>
                        <PopoverTrigger>
                            <Button onClick={async () => {
                                const lint: PromptLint = await notifyFetch(getAPIServer() + `prompt/${selectedPrompt?.id}/lint`, sendingAlertProp, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    }
                                }, '프롬프트를 검토하는중...')
                                if (lint.check == 'ok') {
                                    lintPopoverProp.onOpen()
                                } else {
                                    setLintModalMessage(lint.message)
                                    lintModalProp.onOpen()
                                }
                            }}>검토</Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverArrow/>
                            <PopoverCloseButton/>
                            <PopoverHeader>문제 없음!</PopoverHeader>
                            <PopoverBody>프롬프트에서 알려진 문제가 없었습니다.</PopoverBody>
                        </PopoverContent>
                    </Popover>
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
            <Modal isOpen={lintModalProp.isOpen} onClose={lintModalProp.onClose}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>알려진 문제가 있습니다.</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                        <Card variant={"unstyled"}>
                            <CardBody>
                                <Stack padding={'8px'} divider={<StackDivider/>} spacing='4'>
                                    {lintModalMessage.map((item) => (
                                        <Text>{item}</Text>
                                    ))}
                                </Stack>
                            </CardBody>
                        </Card>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme='blue' mr={3} onClick={lintModalProp.onClose}>
                            닫기
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
}