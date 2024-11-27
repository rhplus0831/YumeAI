import {Box, Button, Card, CardBody, Flex, Grid, GridItem, Input, Stack, StackDivider} from "@chakra-ui/react";
import * as React from "react";
import MessageBox from "./MessageBox";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert";
import {getAPIServer} from "../../../Configure";
import Room from "../Room";
import Message, {MessageRole} from "./Message";
import ScrollToBottom from 'react-scroll-to-bottom';

export default function MessageList({room}: { room: Room | null }) {
    const [userMessage, setUserMessage] = React.useState<string>("");
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [currentRoomId, setCurrentRoomId] = React.useState(-1);

    let sending = false
    const sendingAlertProp = useSendingAlert()

    const sendMessage = async () => {
        if (room === null) {
            return
        }
        if (sending) {
            return
        }
        sending = true;
        const sendTemp: Message[] = [{"role": MessageRole.User, "text": userMessage, "key": "sending"} as Message]
        // keep in temp variable because react state is async
        const tempMessages = messages.slice(0).concat(sendTemp)
        setMessages(tempMessages)
        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + '/message', sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({"text": userMessage})
            }, "메시지를 보내고 있습니다...", true)
            //서버에서 유저가 보낸 메시지를 포함한 응답을 다시 보내주기 때문에 한줄 자름
            setMessages(tempMessages.slice(0, -1).concat(data.messages));
            setUserMessage("")
        } catch {
            setMessages(tempMessages.slice(0, -1))
        }
        sending = false;
    }

    React.useEffect(() => {
        if (room === null) {
            setCurrentRoomId(-1)
            setMessages([])
            return;
        }
        if (room.id === currentRoomId) {
            return
        }
        setCurrentRoomId(room.id)

        async function getMessageList() {
            if (room === null) {
                return
            }
            if (sending) {
                return
            }
            sending = true;
            try {
                const data = await notifyFetch(getAPIServer() + 'room/' + room.id + '/message', sendingAlertProp, {
                    method: "GET"
                }, "기존 메시지를 받아오고 있습니다...")
                setMessages(data.messages)
            } catch { /* empty */ }
            sending = false;
        }

        getMessageList().then()
    }, [room])

    return (
        <Grid display={room !== null ? 'grid' : 'none'} templateRows={'1fr auto'} minHeight={'100%'} maxHeight={'100%'}>
            <GridItem minHeight={'100%'} maxHeight={'100%'}>
                <Flex flexDirection="column-reverse" minHeight={'100%'} maxHeight={'100%'} overflow={"scroll"}>
                    <ScrollToBottom>
                        <Card variant={"unstyled"} flex="1" overflowY="auto">
                            <CardBody>
                                <Stack divider={<StackDivider/>} spacing='4'>
                                    {messages.map(message => (
                                        <MessageBox room={room} message={message} key={message.key}></MessageBox>
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