import React from "react";
import {
    Box,
    Button, Divider,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    useDisclosure,
    VStack
} from "@chakra-ui/react";
import Room from "./Room";
import BotSelectBox from "../Bot/BotSelectBox";
import {getAPIServer} from "../../Configure";
import PersonaSelectBox from "../Persona/PersonaSelectBox";
import Bot from "../Bot/Bot";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import BaseData from "../Base/BaseData.ts";
import PromptSelectBox from "../Prompt/PromptSelectBox.tsx";
import Prompt from "../Prompt/Prompt.ts";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import SendingAlert from "../../Base/SendingAlert/SendingAlert.tsx";

export default function RoomSidebar({selectedRoom, setSelectedRoom, onEdited, onRemoved}: {
    selectedRoom: Room | null,
    setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>,
    onEdited: (data: Room) => void
    onRemoved: (data: Room) => void
}) {
    const [name, setName] = React.useState("");

    React.useEffect(() => {
        if (selectedRoom === null) return
        setName(selectedRoom.name)
    }, [selectedRoom])

    const modalProps = useDisclosure()
    const sendingAlertProp = useSendingAlert()

    return (
        <Box display={selectedRoom !== null ? "block" : "none"}>
            <Button onClick={() => {
                setSelectedRoom(null)
            }}>돌아가기</Button>
            <Divider/>
            <Text fontSize={"xl"}>방 이름</Text>
            <AutoSubmitEditable endpoint={getAPIServer() + 'room/' + selectedRoom?.id} valueName={'name'} value={name}
                                setValue={(name: string) => {
                                    if (selectedRoom === null) return
                                    setName(name)
                                }} onEdited={onEdited}></AutoSubmitEditable>
            <Divider/>
            <Text fontSize={"xl"}>페르소나</Text>
            <PersonaSelectBox
                persona={selectedRoom !== null && selectedRoom.persona !== undefined ? selectedRoom.persona : null}
                onSelected={async (persona: BaseData, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                    if (selectedRoom === null) return
                    try {
                        onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                'persona_id': persona.id,
                            })
                        }, '페르소나 선택중...') as Room)
                    } catch { /* empty */
                    }
                }}></PersonaSelectBox>
            <Divider/>
            <Text fontSize={"xl"}>봇</Text>
            <BotSelectBox bot={selectedRoom !== null && selectedRoom.bot !== undefined ? selectedRoom.bot : null}
                          onSelected={async (bot: Bot, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                              if (selectedRoom === null) return
                              try {
                                  onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                                      method: 'PUT',
                                      headers: {
                                          "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                          'bot_id': bot.id,
                                      })
                                  }, '봇 선택중...') as Room)
                              } catch { /* empty */
                              }
                          }}></BotSelectBox>
            <Divider/>
            <Text fontSize={"xl"}>프롬프트</Text>
            <PromptSelectBox
                prompt={selectedRoom !== null && selectedRoom.prompt !== undefined ? selectedRoom.prompt : null}
                onSelected={async (prompt: Prompt, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                    if (selectedRoom === null) return
                    try {
                        onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                'prompt_id': prompt.id,
                            })
                        }, '프롬프트 선택중...') as Room)
                    } catch { /* empty */
                    }
                }}></PromptSelectBox>
            <Divider/>
            <Text fontSize={"xl"}>요약용 프롬프트</Text>
            <PromptSelectBox
                prompt={selectedRoom !== null && selectedRoom.summary_prompt !== undefined ? selectedRoom.summary_prompt : null}
                onSelected={async (prompt: Prompt, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                    if (selectedRoom === null) return
                    try {
                        onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                'summary_prompt_id': prompt.id,
                            })
                        }, '요약용 프롬프트 선택중...') as Room)
                    } catch { /* empty */
                    }
                }}></PromptSelectBox>
            <Divider/>
            <Text fontSize={"xl"}>번역용 프롬프트</Text>
            <PromptSelectBox
                prompt={selectedRoom !== null && selectedRoom.translate_prompt !== undefined ? selectedRoom.translate_prompt : null}
                onSelected={async (prompt: Prompt, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                    if (selectedRoom === null) return
                    try {
                        onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                'translate_prompt_id': prompt.id,
                            })
                        }, '번역용 프롬프트 선택중...') as Room)
                    } catch { /* empty */
                    }
                }}></PromptSelectBox>
            <br/>
            <Button colorScheme={'red'} onClick={() => {
                modalProps.onOpen()
            }}>삭제하기</Button>
            <SendingAlert {...sendingAlertProp}></SendingAlert>
            <Modal {...modalProps}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader><b>정말로 방을 삭제하시겠습니까?</b></ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody pb={6}>
                        방을 한번 삭제하면 되돌릴 수 없습니다!<br/>
                        정말로 삭제하시겠습니까?
                    </ModalBody>
                    <ModalFooter>
                        <VStack width={"auto"}>
                            <HStack>
                                <Button onClick={modalProps.onClose} colorScheme='blue' mr={3}>
                                    아뇨?
                                </Button>
                                <Button onClick={() => {
                                    if (selectedRoom == null) return;
                                    modalProps.onClose()
                                    notifyFetch(getAPIServer() + `room/${selectedRoom?.id}`, sendingAlertProp, {method: 'DELETE'}, '방에서 나가는 중입니다...').then(() => {
                                        onRemoved(selectedRoom)
                                    })
                                }} colorScheme='red' mr={3}>
                                    지울래
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    )
}
