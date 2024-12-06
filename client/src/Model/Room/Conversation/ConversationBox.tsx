import MessageBox from "./MessageBox.tsx";
import Conversation from "./Conversation.ts";
import Room from "../Room.ts";
import {DeleteIcon, Icon, RepeatIcon, TriangleDownIcon} from "@chakra-ui/icons";
import {Box, Button, ButtonGroup, IconButton} from "@chakra-ui/react";
import {MdOutlineTranslate} from "react-icons/md";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert.ts";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert.tsx";
import {StreamData} from "../../Base/StreamData.ts";
import {getAPIServer} from "../../../Configure.ts";
import {useState} from "react";

export default function ConversationBox({room, conversation, updateConversation, removeConversation, isLast}: {
    room: Room | null,
    conversation: Conversation,
    updateConversation: (conversation: Conversation) => void,
    removeConversation: (conversation: Conversation) => void,
    isLast: boolean
}) {
    // 코딩 블로킹용 (빠른 더블클릭 방지)
    let blockInSending = false
    let [isInSending, setIsInSending] = useState<boolean>(false)
    let [isInTranslate, setIsInTranslate] = useState<boolean>(false)

    let [revertConfirm, setRevertConfirm] = useState<boolean>(false)

    const sendingAlertProp = useSendingAlert()

    const translateIcon = (<Icon as={MdOutlineTranslate} w={'24px'} h={'24px'}/>)

    const translateSelf = async () => {
        if (!room) return;
        if (blockInSending) return;
        blockInSending = true;
        setIsInSending(true);
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
            blockInSending = false;
            setIsInSending(false);
            setIsInTranslate(false);
        }
    }

    const reRollSelf = async () => {
        if (!room) return;
        if (blockInSending) return;
        blockInSending = true;
        setIsInSending(true);

        let assistantMessage = "";

        const receiver = (data: unknown) => {
            const message = (data as StreamData).message
            assistantMessage += message
            setReceivingAssistantMessage(assistantMessage)
        }

        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/re_roll`, sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }, "메시지를 리롤하고 있습니다...", true, receiver)
            updateConversation(data)
        } finally {
            setReceivingAssistantMessage("");
            blockInSending = false;
            setIsInSending(false);
        }
    }

    const revertSelf = async () => {
        if (!room) return;
        if (blockInSending) return;
        blockInSending = true;
        setIsInSending(true);

        try {
            await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/revert`, sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }, "메시지를 제거하고 있습니다...")
            removeConversation(conversation)
        } finally {
            setReceivingAssistantMessage("");
            blockInSending = false;
            setIsInSending(false);
        }
    }

    let [receivingUserMessage, setReceivingUserMessage] = useState<string>("");
    let [receivingAssistantMessage, setReceivingAssistantMessage] = useState<string>("");

    let [useTranslate, setUseTranslate] = useState<boolean>(false);

    const getUserMessage = () => {
        if (!room) return "";
        if (isInTranslate && !room.translate_only_assistant) return receivingUserMessage;
        if (conversation.user_message_translated && useTranslate && !room.translate_only_assistant) return conversation.user_message_translated;
        if (conversation.user_message) return conversation.user_message;
        return "";
    }

    const getAssistantMessage = () => {
        if (isInSending) return receivingAssistantMessage;
        if (conversation.assistant_message_translated && useTranslate) return conversation.assistant_message_translated;
        if (conversation.assistant_message) return conversation.assistant_message;
        return "";
    }

    const switchTranslate = () => {
        if (useTranslate) {
            setUseTranslate(false)
        } else {
            setUseTranslate(true)
            if (!conversation.assistant_message_translated) {
                translateSelf().then()
            }
        }
    }

    return (
        <>
            {conversation.user_message ?
                <MessageBox message={getUserMessage()} name={room?.persona?.displayName}
                            profileImageId={room?.persona?.profileImageId}></MessageBox> : ""}
            {conversation.user_message && conversation.assistant_message ?
                <Box marginY={'8px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                    <TriangleDownIcon></TriangleDownIcon>
                </Box> : ""}
            {conversation.assistant_message ? <>
                <MessageBox message={getAssistantMessage()} name={room?.bot?.displayName}
                            profileImageId={room?.bot?.profileImageId}></MessageBox>
                <Box marginY={'8px'} display={'flex'} margin={"8px"} justifyContent={'right'} alignItems={'right'}>
                    {useTranslate && conversation.assistant_message_translated ?
                        <ButtonGroup size='md' isAttached>
                            <Button disabled={isInSending} aria-label={"다시 번역"} leftIcon={<RepeatIcon/>}
                                    onClick={() => {
                                        translateSelf().then()
                                    }}>다시 번역</Button>
                            <IconButton disabled={isInSending} aria-label={"번역"} colorScheme={"green"}
                                        icon={translateIcon}
                                        onClick={switchTranslate}/>
                        </ButtonGroup>
                        : <IconButton disabled={isInSending} size='md' aria-label={"번역"} icon={translateIcon}
                                      onClick={switchTranslate}/>}
                    {isLast ?
                        <ButtonGroup marginLeft={"0.5em"} size={'md'}>
                            <Button disabled={isInSending} aria-label={"리롤"}
                                    leftIcon={<RepeatIcon/>} onClick={() => {
                                reRollSelf().then()
                            }}>리롤</Button>
                            <Button disabled={isInSending} _hover={{bg: "red.500"}} marginLeft={"0.5em"}
                                    aria-label={"삭제"}
                                    leftIcon={<DeleteIcon/>} onClick={() => {
                                if (!revertConfirm) {
                                    setRevertConfirm(true)
                                    setTimeout(() => {
                                        setRevertConfirm(false)
                                    }, 5000)
                                    return
                                }
                                revertSelf().then()
                            }}>{revertConfirm ? "확실한가요?" : "삭제"}</Button>
                        </ButtonGroup>
                        : ""}
                </Box>
            </> : ""}
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </>
    )
}