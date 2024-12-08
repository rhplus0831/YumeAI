import MessageBox from "./MessageBox.tsx";
import Conversation from "./Conversation.ts";
import Room from "../Room.ts";
import {CheckIcon, CloseIcon, EditIcon, Icon, RepeatIcon, TriangleDownIcon} from "@chakra-ui/icons";
import {Box, Button, ButtonGroup, IconButton, Text} from "@chakra-ui/react";
import {MdOutlineTranslate} from "react-icons/md";
import {notifyFetch, useSendingAlert} from "../../../Base/SendingAlert/useSendingAlert.ts";
import SendingAlert from "../../../Base/SendingAlert/SendingAlert.tsx";
import {StreamData} from "../../Base/StreamData.ts";
import {getAPIServer} from "../../../Configure.ts";
import {useState} from "react";
import {googleTranslate} from "../../../Base/GoogleTranslate.ts";
import DeleteConfirmButton from "../../../Base/DeleteConfirmButton.tsx";
import Filter, {ApplyFilter} from "../../Filter/Filter.ts";
import {AutoResizeTextarea} from "../../../Base/AutoResizeTextarea.tsx";

export default function ConversationBox({room, conversation, updateConversation, removeConversation, isLast, filters}: {
    room: Room | null,
    conversation: Conversation,
    updateConversation: (conversation: Conversation) => void,
    removeConversation: (conversation: Conversation) => void,
    isLast: boolean,
    filters: Filter[]
}) {
    // 코딩 블로킹용 (빠른 더블클릭 방지)
    let blockInSending = false
    let [isInSending, setIsInSending] = useState<boolean>(false)
    let [isInTranslate, setIsInTranslate] = useState<boolean>(false)

    let [isInEditing, setIsInEditing] = useState<boolean>(false)
    let [editingText, setEditingText] = useState<string>("")

    const sendingAlertProp = useSendingAlert()

    const translateIcon = (<Icon as={MdOutlineTranslate} w={'24px'} h={'24px'}/>)

    let [isInSummaryView, setIsInSummaryView] = useState<boolean>(false)

    const activeSummaryView = async () => {
        if (!room) return;
        if (conversation.summary) {
            setIsInSummaryView(true)
            return
        }
        blockInSending = true;
        setIsInSending(true);

        try {
            let newConversation = conversation
            newConversation.summary = await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/get_summary/${conversation.id}`, sendingAlertProp, {
                method: "GET"
            }, "요약 정보를 가져오고 있습니다...")
            updateConversation(newConversation)
            setIsInSummaryView(true)
        } finally {
            blockInSending = false;
            setIsInSending(false);
        }
    }

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
                setReceivingUserMessage(ApplyFilter(filters, ["translate"], userMessage))
            } else {
                assistantMessage += message
                setReceivingAssistantMessage(ApplyFilter(filters, ["translate"], assistantMessage))
            }
        }

        try {
            if (room.translate_method == "google") {
                if (conversation.user_message) {
                    await googleTranslate(ApplyFilter(filters, ["display"], conversation.user_message), sendingAlertProp, receiver)
                }
                isInUser = false;
                if (conversation.assistant_message) {
                    await googleTranslate(ApplyFilter(filters, ["display"], conversation.assistant_message), sendingAlertProp, receiver)
                }
                const googlePutData = await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/put_translate/${conversation.id}`, sendingAlertProp, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "user_message_translated": userMessage,
                        "assistant_message_translated": assistantMessage
                    })
                }, "번역 정보를 서버에 등록하고 있습니다...")
                updateConversation(googlePutData)
                return
            }

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

    const editSelf = async () => {
        if (!room) return;
        if (blockInSending) return;
        blockInSending = true;
        setIsInSending(true);

        try {
            const data = await notifyFetch(getAPIServer() + 'room/' + room.id + `/conversation/edit`, sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "text": editingText
                })
            }, "메시지를 수정하고 있습니다...")
            updateConversation(data)
        } finally {
            blockInSending = false;
            setIsInSending(false);
            setIsInEditing(false)
        }
    }

    let [receivingUserMessage, setReceivingUserMessage] = useState<string>("");
    let [receivingAssistantMessage, setReceivingAssistantMessage] = useState<string>("");

    let [isInTranslateView, setIsInTranslateView] = useState<boolean>(false);

    const getUserMessage = () => {
        if (!room) return "";
        if (isInTranslate && !room.translate_only_assistant) return ApplyFilter(filters, ["display", "display_final"], receivingUserMessage);
        if (conversation.user_message_translated && isInTranslateView && !room.translate_only_assistant) return ApplyFilter(filters, ["display", "display_final"], conversation.user_message_translated);
        if (conversation.user_message) return ApplyFilter(filters, ["display", "display_final"], conversation.user_message);
        return "";
    }

    const getAssistantMessage = () => {
        if (isInSending) return ApplyFilter(filters, ["display", "display_final"], receivingAssistantMessage);
        if (conversation.assistant_message_translated && isInTranslateView) return ApplyFilter(filters, ["display", "display_final"], conversation.assistant_message_translated);
        if (conversation.assistant_message) return ApplyFilter(filters, ["display", "display_final"], conversation.assistant_message);
        return "";
    }

    const switchTranslate = () => {
        if (isInTranslateView) {
            setIsInTranslateView(false)
        } else {
            setIsInTranslateView(true)
            if (!conversation.assistant_message_translated) {
                translateSelf().then()
            }
        }
    }

    return (
        <Box paddingX={"20px"}>
            {isInSummaryView && conversation.summary ?
                <Text>{conversation.summary.is_top ? "" : <>이 요약은 재요약 되었으며 요청에 들어가지 않습니다.<br/></>}
                    {conversation.summary.content}</Text> : <>
                    {conversation.user_message ?
                        <MessageBox message={getUserMessage()} name={room?.persona?.displayName}
                                    profileImageId={room?.persona?.profileImageId}></MessageBox> : ""}
                    {conversation.user_message && conversation.assistant_message ?
                        <Box marginY={'8px'} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                            <TriangleDownIcon></TriangleDownIcon>
                        </Box> : ""}
                </>}

            {conversation.assistant_message ? <>
                {!isInSummaryView && !isInEditing ?
                    <MessageBox message={getAssistantMessage()} name={room?.bot?.displayName}
                                profileImageId={room?.bot?.profileImageId}></MessageBox> : ""}
                {isInEditing ? <AutoResizeTextarea value={editingText} onChange={(event) => {
                    setEditingText(event.target.value)
                }}/> : ""}
                <Box marginY={'8px'} display={'flex'} margin={"8px"} justifyContent={'right'} alignItems={'right'}>
                    {isLast ?
                        <ButtonGroup size={'md'}>
                            {isInEditing ?
                                <>
                                    <Button disabled={isInSending} aria-label={"저장"}
                                            leftIcon={<CheckIcon/>} onClick={() => {
                                        if (!conversation.assistant_message) return
                                        editSelf().then()
                                    }}>저장</Button>
                                    <Button disabled={isInSending} aria-label={"취소"}
                                            leftIcon={<CloseIcon/>} onClick={() => {
                                        if (!conversation.assistant_message) return
                                        setIsInEditing(false)
                                    }}>취소</Button>
                                </>
                                : <>
                                    <Button disabled={isInSending} aria-label={"리롤"}
                                            leftIcon={<RepeatIcon/>} onClick={() => {
                                        reRollSelf().then()
                                    }}>리롤</Button>
                                    <Button disabled={isInSending} aria-label={"수정"}
                                            leftIcon={<EditIcon/>} onClick={() => {
                                        if (!conversation.assistant_message) return
                                        setEditingText(conversation.assistant_message)
                                        setIsInEditing(true)
                                    }}>수정</Button>
                                    <DeleteConfirmButton disabled={isInSending} marginLeft={"0.5em"}
                                                         onConfirmed={() => {
                                                             revertSelf().then()
                                                         }}></DeleteConfirmButton>
                                </>}
                        </ButtonGroup>
                        : ""}
                    {!isLast ? <Button onClick={() => {
                        isInSummaryView ? setIsInSummaryView(false) : activeSummaryView()
                    }}>{isInSummaryView ? "원문보기" : "요약보기"}</Button> : ""}
                    {!isInEditing ? <>
                        {isInTranslateView && conversation.assistant_message_translated ?
                            <ButtonGroup marginLeft={"0.5em"} size='md' isAttached>
                                <Button disabled={isInSending} aria-label={"다시 번역"} leftIcon={<RepeatIcon/>}
                                        onClick={() => {
                                            translateSelf().then()
                                        }}>다시 번역</Button>
                                <IconButton disabled={isInSending} aria-label={"번역"} colorScheme={"green"}
                                            icon={translateIcon}
                                            onClick={switchTranslate}/>
                            </ButtonGroup>
                            : <IconButton marginLeft={"0.5em"} disabled={isInSending} size='md' aria-label={"번역"}
                                          icon={translateIcon}
                                          onClick={switchTranslate}/>}</> : ""}
                </Box>
            </> : ""}
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </Box>
    )
}