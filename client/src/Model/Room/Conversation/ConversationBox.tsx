import MessageBox from "./MessageBox.tsx";
import Conversation from "./Conversation.ts";
import Room from "../Room.ts";
import {Icon, RepeatIcon, TriangleDownIcon} from "@chakra-ui/icons";
import {Box, ButtonGroup, IconButton} from "@chakra-ui/react";
import {MdOutlineTranslate} from "react-icons/md";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert.ts";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert.tsx";
import {StreamData} from "../../Base/StreamData.ts";
import {getAPIServer} from "../../../Configure.ts";
import {useState} from "react";

export default function ConversationBox({room, conversation, updateConversation}: {
    room: Room | null,
    conversation: Conversation,
    updateConversation: (conversation: Conversation) => void
}) {
    // 코딩 블로킹용 (빠른 더블클릭 방지)
    let blockInTranslate = false
    let [isInTranslate, setIsInTranslate] = useState<boolean>(false)

    const sendingAlertProp = useSendingAlert()

    const translateIcon = (<Icon as={MdOutlineTranslate} w={'24px'} h={'24px'}/>)

    const translateSelf = async () => {
        if (!room) return;
        if (blockInTranslate) return;
        blockInTranslate = true;
        setIsInTranslate(true);

        let isInUser = true;

        let userMessage = "";
        let assistantMessage = "";

        const receiver = (data: unknown) => {
            const message = (data as StreamData).message

            if (message.startsWith("yume||switch")) {
                isInUser = false;
                return
            }

            if (isInUser) {
                userMessage += message
                setReceivingUserMessage(userMessage)
            } else {
                assistantMessage += message
                setReceivingAssistantMessage(assistantMessage)
            }
        }

        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/${conversation.id}/translate`, sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }, "대화를 번역하고 있습니다...", true, receiver)
            updateConversation(data)
        } finally {
            setReceivingUserMessage("");
            setReceivingAssistantMessage("");
            blockInTranslate = false;
            setIsInTranslate(false);
        }
    }

    let [receivingUserMessage, setReceivingUserMessage] = useState<string>("");
    let [receivingAssistantMessage, setReceivingAssistantMessage] = useState<string>("");

    let [useTranslate, setUseTranslate] = useState<boolean>(false);

    const getUserMessage = () => {
        if (isInTranslate) return receivingUserMessage;
        if (conversation.user_message_translated && useTranslate) return conversation.user_message_translated;
        if (conversation.user_message) return conversation.user_message;
        return "";
    }

    const getAssistantMessage = () => {
        if (isInTranslate) return receivingAssistantMessage;
        if (conversation.assistant_message_translated && useTranslate) return conversation.assistant_message_translated;
        if (conversation.assistant_message) return conversation.assistant_message;
        return "";
    }

    const switchTranslate = () => {
        if (useTranslate) {
            setUseTranslate(false)
        } else {
            setUseTranslate(true)
            if (!conversation.user_message_translated) {
                translateSelf().then()
            }
        }
    }

    return (
        <>
            {conversation.user_message ?
                <MessageBox message={getUserMessage()} name={room?.persona?.displayName}
                            profileImageId={room?.persona?.profileImageId}></MessageBox> : ""}
            {conversation.assistant_message ? <>
                <Box marginY={'8px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <TriangleDownIcon></TriangleDownIcon>
                </Box>
                <MessageBox message={getAssistantMessage()} name={room?.bot?.displayName}
                            profileImageId={room?.bot?.profileImageId}></MessageBox>
            </> : ""}
            {conversation.user_message && conversation.assistant_message ? <>
                <Box marginY={'8px'} display={'flex'} margin={"8px"} justifyContent={'right'} alignItems={'right'}>
                    {useTranslate && conversation.user_message_translated ?
                        <ButtonGroup size='md' isAttached>
                            <IconButton aria-label={"번역"} colorScheme={"green"} icon={translateIcon} onClick={switchTranslate}/>
                            <IconButton aria-label={"다시 번역"} icon={<RepeatIcon/>} onClick={() => {
                                translateSelf().then()
                            }}/>
                        </ButtonGroup>
                        : <IconButton size='md' aria-label={"번역"} icon={translateIcon} onClick={switchTranslate}/>}
                </Box>
            </> : ""}
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </>
    )
}