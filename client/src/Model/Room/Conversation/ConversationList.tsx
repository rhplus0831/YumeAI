import {Box, Button, Card, CardBody, Flex, Grid, GridItem, Stack, StackDivider} from "@chakra-ui/react";
import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert";
import {getAPIServer} from "../../../Configure";
import Room from "../Room";
import Conversation from "./Conversation.ts";
import ScrollToBottom from 'react-scroll-to-bottom';
import ConversationBox from "./ConversationBox.tsx";
import {AutoResizeTextarea} from "../../../Base/AutoResizeTextarea.tsx";
import {StreamData} from "../../Base/StreamData.ts";
import Filter from "../../Filter/Filter.ts";

export default function ConversationList({room}: { room: Room | null }) {
    const [userMessage, setUserMessage] = React.useState<string>("");
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [currentRoomId, setCurrentRoomId] = React.useState(-1);

    let sending = false
    const sendingAlertProp = useSendingAlert()

    let [filters, setFilters] = useState<Filter[]>([])
    useEffect(() => {
        if (!room) return
        let making: Filter[] = []
        if (room.prompt?.filters) {
            making = making.concat(JSON.parse(room.prompt.filters))
        }
        console.log(making)
        setFilters(making)
    }, [room])

    const updateConversation = (conversation: Conversation) => {
        const newConversations = conversations.map((item: Conversation) => {
            if (item.id == conversation?.id) {
                return conversation;
            } else {
                return item;
            }
        })
        setConversations(newConversations)
    }

    const removeConversation = (conversation: Conversation) => {
        const newConversations = conversations.filter((item: Conversation) => {
            return item.id != conversation.id
        })
        setConversations(newConversations)
    }

    const sendMessage = async () => {
        if (!room) {
            return
        }
        if (sending) {
            return
        }
        sending = true;
        const sendTemp: Conversation[] = [{
            "room_id": room.id,
            "created_at": new Date(),
            "user_message": userMessage,
            "assistant_message": null,
            "id": -1
        } as Conversation]
        // keep in temp variable because react state is async
        const tempConversations = conversations.slice(0).concat(sendTemp)
        setConversations(tempConversations)

        const receiver = (data: unknown) => {
            if (sendTemp[0].assistant_message == null) {
                sendTemp[0].assistant_message = ""
            }
            sendTemp[0].assistant_message += (data as StreamData).message
            setConversations(tempConversations.slice(0, -1).concat(sendTemp));
        }

        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + '/conversation/send', sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"text": userMessage})
            }, "메시지를 보내고 있습니다...", true, receiver)
            //서버에서 유저가 보낸 메시지를 포함한 응답을 다시 보내주기 때문에 한줄 자름
            setConversations(tempConversations.slice(0, -1).concat(data));
            setUserMessage("")
        } catch {
            setConversations(tempConversations.slice(0, -1))
        }
        sending = false;
    }

    React.useEffect(() => {
        if (room === null) {
            setCurrentRoomId(-1)
            setConversations([])
            return;
        }
        if (room.id === currentRoomId) {
            return
        }
        setCurrentRoomId(room.id)

        async function getConversationList() {
            if (room === null) {
                return
            }
            if (sending) {
                return
            }
            sending = true;
            try {
                const data = await notifyFetch(getAPIServer() + 'room/' + room.id + '/conversation', sendingAlertProp, {
                    method: "GET"
                }, "기존 메시지를 받아오고 있습니다...")
                setConversations(data)
            } catch { /* empty */
            }
            sending = false;
        }

        getConversationList().then()
    }, [room])

    const isCanImportFirstMessage = () => {
        if (conversations.length > 1) return false;
        if (conversations.length == 1) {
            if (conversations[0].user_message) return false;
        }
        return true;
    }

    const cachedConversations = useMemo(() => {
        return conversations.map((conversation, index) => (
            <ConversationBox
                room={room}
                key={conversation.id.toString()}
                conversation={conversation}
                updateConversation={updateConversation}
                removeConversation={removeConversation}
                isLast={index === conversations.length - 1}
                filters={filters}
            />
        ));
    }, [conversations, room, filters]);

    return (
        <>
            <Grid display={room !== null ? 'grid' : 'none'} templateRows={'1fr auto'} minHeight={'100%'}
                  maxHeight={'100%'}>
                <GridItem minHeight={'100%'} maxHeight={'100%'}>
                    <Flex flexDirection="column-reverse" minHeight={'100%'} maxHeight={'100%'} overflow={"scroll"}>
                        <ScrollToBottom>
                            <Card variant={"unstyled"} flex="1" overflowY="auto">
                                <CardBody>
                                    <Stack divider={<StackDivider/>} spacing='4'>
                                        {cachedConversations}
                                    </Stack>
                                </CardBody>
                            </Card>
                        </ScrollToBottom>
                    </Flex>
                </GridItem>
                <GridItem display={isCanImportFirstMessage() ? "grid" : "none"}>
                    <Button onClick={async () => {
                        if (!room) return;
                        const data = await notifyFetch(getAPIServer() + `room/${room.id}/conversation/apply_first_message`, sendingAlertProp, {
                            method: 'POST'
                        }, "퍼스트 메시지를 적용중입니다...")
                        setConversations([data])
                    }}>퍼스트 메시지 적용하기</Button>
                </GridItem>
                <GridItem>
                    <Box>
                        <SendingAlert {...sendingAlertProp}></SendingAlert>
                        <Grid templateColumns={'1fr 6em'} templateRows={'1fr'} marginTop="16px">
                            <GridItem>
                                <AutoResizeTextarea id="chatbox-input" value={userMessage} onChange={(event) => {
                                    setUserMessage(event.target.value)
                                }} placeholder="여기에 보낼 메시지를 입력하세요"/>
                            </GridItem>
                            <GridItem>
                                <Button h={"100%"} onClick={sendMessage}>
                                    보내기!
                                </Button>
                            </GridItem>
                        </Grid>
                    </Box>
                </GridItem>
            </Grid>
        </>
    )
}