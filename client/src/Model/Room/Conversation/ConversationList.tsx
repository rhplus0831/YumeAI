import {Box, Button, Card, CardBody, Flex, Grid, GridItem, Input, Stack, StackDivider} from "@chakra-ui/react";
import * as React from "react";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert";
import {getAPIServer} from "../../../Configure";
import Room from "../Room";
import Conversation from "./Conversation.ts";
import ScrollToBottom from 'react-scroll-to-bottom';
import ConversationBox from "./ConversationBox.tsx";

export default function ConversationList({room}: { room: Room | null }) {
    const [userMessage, setUserMessage] = React.useState<string>("");
    const [conversations, setConversations] = React.useState<Conversation[]>([]);
    const [currentRoomId, setCurrentRoomId] = React.useState(-1);

    let sending = false
    const sendingAlertProp = useSendingAlert()

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
        const tempMessages = conversations.slice(0).concat(sendTemp)
        setConversations(tempMessages)
        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + '/conversation/send', sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"text": userMessage})
            }, "메시지를 보내고 있습니다...", true)
            //서버에서 유저가 보낸 메시지를 포함한 응답을 다시 보내주기 때문에 한줄 자름
            setConversations(tempMessages.slice(0, -1).concat(data.messages));
            setUserMessage("")
        } catch {
            setConversations(tempMessages.slice(0, -1))
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
                setConversations(data.conversations)
            } catch { /* empty */
            }
            sending = false;
        }

        getConversationList().then()
    }, [room])

    return (
        <Grid display={room !== null ? 'grid' : 'none'} templateRows={'1fr auto'} minHeight={'100%'} maxHeight={'100%'}>
            <GridItem minHeight={'100%'} maxHeight={'100%'}>
                <Flex flexDirection="column-reverse" minHeight={'100%'} maxHeight={'100%'} overflow={"scroll"}>
                    <ScrollToBottom>
                        <Card variant={"unstyled"} flex="1" overflowY="auto">
                            <CardBody>
                                <Stack divider={<StackDivider/>} spacing='4'>
                                    {conversations.map(conversation => (
                                        <ConversationBox room={room} conversation={conversation}/>
                                    ))}
                                </Stack>
                            </CardBody>
                        </Card>
                    </ScrollToBottom>
                </Flex>
            </GridItem>
            <GridItem>
                <Box>
                    <SendingAlert {...sendingAlertProp}></SendingAlert>
                    <Flex flexDirection="row" justifyContent="end" marginTop="16px">
                        <Input id="chatbox-input" value={userMessage} onChange={(event) => {
                            setUserMessage(event.target.value)
                        }} placeholder="여기에 보낼 메시지를 입력하세요"></Input>
                        <Button onClick={sendMessage}>
                            보내기!
                        </Button>
                    </Flex>
                </Box>
            </GridItem>
        </Grid>

    )
}