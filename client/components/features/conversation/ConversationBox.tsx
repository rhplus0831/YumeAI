import Conversation from "@/lib/data/Conversation";
import MessageBox from "@/components/features/conversation/MessageBox";
import Room from "@/lib/data/Room";
import Filter, {ApplyFilter} from "@/lib/data/Filter";
import PendingAlert from "@/components/ui/PendingAlert/PendingAlert";
import {pendingFetch, usePendingAlert} from "@/components/ui/PendingAlert/usePendingAlert";
import {useEffect, useRef, useState} from "react";
import {googleTranslate} from "@/lib/import/GoogleTranslate";
import {buildAPILink} from "@/lib/api-client";
import {Button, ButtonGroup} from "@nextui-org/react";
import {MdModeEdit, MdOutlineCancel, MdOutlineCheck, MdOutlineTranslate, MdRepeat} from "react-icons/md";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {Textarea} from "@nextui-org/input";
import {HiOutlineChatBubbleOvalLeftEllipsis} from "react-icons/hi2";

export default function ConversationBox({
                                            room,
                                            conversation,
                                            updateConversation,
                                            removeConversation,
                                            isLast,
                                            filters,
                                            checkedToggles
                                        }: {
    room: Room | null,
    conversation: Conversation,
    updateConversation: (conversation: Conversation) => void,
    removeConversation: (conversation: Conversation) => void,
    isLast: boolean,
    filters: Filter[],
    checkedToggles: string,
}) {
    const pendingProps = usePendingAlert()
    const blockInSending = useRef(false);
    const [isInSending, setIsInSending] = useState<boolean>(false)
    const [isInTranslate, setIsInTranslate] = useState<boolean>(false)

    let [isInEditing, setIsInEditing] = useState<boolean>(false)
    let [editingText, setEditingText] = useState<string>("")

    const [receivingUserMessage, setReceivingUserMessage] = useState<string>("");
    const [receivingAssistantMessage, setReceivingAssistantMessage] = useState<string>("");

    const [isInTranslateView, setIsInTranslateView] = useState<boolean>(false);
    const [isInSummaryView, setIsInSummaryView] = useState<boolean>(false)

    const activeSummaryView = async () => {
        if (!room) return;
        if (conversation.summary) {
            setIsInSummaryView(true)
            return
        }
        blockInSending.current = true;
        setIsInSending(true);

        try {
            let newConversation = conversation
            newConversation.summary = await pendingFetch(buildAPILink('room/' + room.id + `/conversation/get_summary/${conversation.id}`), pendingProps, {
                method: "GET"
            }, "요약 정보를 가져오고 있습니다...")
            updateConversation(newConversation)
            setIsInSummaryView(true)
        } finally {
            blockInSending.current = false;
            setIsInSending(false);
        }
    }

    const translateSelf = async () => {
        if (!room) return;
        if (blockInSending.current) return;
        blockInSending.current = true;
        setIsInSending(true);
        setIsInTranslate(true);

        let isInUser = true;
        let userMessage = "";
        let assistantMessage = "";

        const receiver = (message: string) => {
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
                    await googleTranslate(ApplyFilter(filters, ["display"], conversation.user_message), pendingProps, receiver)
                }
                isInUser = false;
                if (conversation.assistant_message) {
                    await googleTranslate(ApplyFilter(filters, ["display"], conversation.assistant_message), pendingProps, receiver)
                }
                const googlePutData = await pendingFetch(buildAPILink('room/' + room.id + `/conversation/put_translate/${conversation.id}`), pendingProps, {
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

            const data = await pendingFetch(buildAPILink('room/' + room.id + `/conversation/${conversation.id}/translate`), pendingProps, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }, "대화를 번역하고 있습니다...", true, receiver)
            updateConversation(data)
        } finally {
            setReceivingUserMessage("");
            setReceivingAssistantMessage("");
            blockInSending.current = false;
            setIsInSending(false);
            setIsInTranslate(false);
        }
    }

    const reRollSelf = async () => {
        if (!room) return;
        if (blockInSending.current) return;
        blockInSending.current = true;
        setIsInSending(true);

        let assistantMessage = "";

        const receiver = (message: string) => {
            assistantMessage += message
            setReceivingAssistantMessage(assistantMessage)
        }

        try {
            const data = await pendingFetch(buildAPILink('room/' + room.id + `/conversation/re_roll`), pendingProps, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    active_toggles: checkedToggles,
                })
            }, "메시지를 리롤하고 있습니다...", true, receiver)
            updateConversation(data)
        } finally {
            setReceivingAssistantMessage("");
            blockInSending.current = false;
            setIsInSending(false);
        }
    }

    const revertSelf = async () => {
        if (!room) return;
        if (blockInSending.current) return;
        blockInSending.current = true;
        setIsInSending(true);

        try {
            await pendingFetch(buildAPILink('room/' + room.id + `/conversation/revert`), pendingProps, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }, "메시지를 제거하고 있습니다...")
            removeConversation(conversation)
        } finally {
            setReceivingAssistantMessage("");
            blockInSending.current = false;
            setIsInSending(false);
        }
    }

    const editSelf = async () => {
        if (!room) return;
        if (blockInSending.current) return;
        blockInSending.current = true;
        setIsInSending(true);

        try {
            const data = await pendingFetch(buildAPILink('room/' + room.id + `/conversation/edit`), pendingProps, {
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
            blockInSending.current = false;
            setIsInSending(false);
            setIsInEditing(false)
        }
    }

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

    const splitAssistantMessage = () => {
        const message = getAssistantMessage()
        if (!message.startsWith("<COT>") || !message.includes('</COT>')) return ["", message];
        const [cot, content] = message.split("</COT>")
        return [cot.slice(5), content]
    }

    const [assistantCOT, assistantContent] = splitAssistantMessage()
    const [displayCOT, setDisplayCOT] = useState(false)

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

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef?.current) {
            containerRef.current.scrollIntoView({behavior: "instant", block: "end"});
        }
    }, [conversation, conversation.user_message, conversation.assistant_message, receivingUserMessage, receivingAssistantMessage, isInTranslateView, isInSummaryView, isInEditing, editingText, isInTranslate, isInSending]);

    if (!room) return undefined

    return <article ref={containerRef} className={"flex flex-col gap-4"}>
        {conversation.user_message && <MessageBox message={getUserMessage()} name={room.persona?.displayName ?? room.persona?.name}
                                                  profileImageId={room.persona?.profileImageId}/>}
        {conversation.assistant_message && <>
            {!isInSummaryView && !isInEditing &&
                <MessageBox message={displayCOT ? assistantCOT : assistantContent}
                            extraNode={assistantCOT && <button onClick={() => {
                                setDisplayCOT(!displayCOT)
                            }}>
                                <HiOutlineChatBubbleOvalLeftEllipsis size={"24"}/>
                            </button>} name={room.bot?.displayName ?? room.bot?.name}
                            profileImageId={room.bot?.profileImageId}/>}
            {isInEditing &&
                <Textarea value={editingText} maxRows={9999} onChange={(e) => setEditingText(e.target.value)}/>}
            <div className={"w-full flex flex-row gap-2 justify-end"}>
                <ButtonGroup isDisabled={isInSending} variant={"bordered"}>
                    {isInEditing ? <>
                        <Button startContent={<MdOutlineCheck size={"20"}/>} onPress={editSelf}>저장</Button>
                        <Button startContent={<MdOutlineCancel size={"20"}/>} onPress={() => {
                            setIsInEditing(false)
                        }}>취소</Button>
                    </> : <>
                        {isLast && <>
                            <Button aria-label={"리롤"} isIconOnly onPress={reRollSelf}><MdRepeat size={"20"}/></Button>
                            <Button aria-label={"수정"} isIconOnly onPress={() => {
                                if (!conversation.assistant_message) return;
                                setEditingText(conversation.assistant_message)
                                setIsInEditing(true)
                            }}><MdModeEdit size={"20"}/></Button>
                            <DeleteConfirmButton confirmCount={2} onConfirmed={() => {
                                revertSelf().then()
                            }}/>
                        </>}
                        {isInTranslateView ? <>
                            <Button startContent={<MdRepeat size={"20"}/>} onPress={translateSelf}>다시 번역</Button>
                            <Button aria-label={"번역"} disableAnimation isIconOnly
                                    onPress={switchTranslate}><MdOutlineTranslate color={"green"}
                                                                                  size={20}/></Button>
                        </> : <>
                            <Button aria-label={"번역"} disableAnimation onPress={switchTranslate}
                                    isIconOnly><MdOutlineTranslate size={20}/></Button>
                        </>}
                    </>}
                </ButtonGroup>
            </div>
        </>}
        <PendingAlert {...pendingProps} />
    </article>
}