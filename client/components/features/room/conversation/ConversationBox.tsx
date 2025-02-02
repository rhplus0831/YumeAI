import Conversation from "@/lib/data/Conversation";
import MessageBox from "@/components/features/room/conversation/MessageBox";
import Room, {RoomDisplayOption} from "@/lib/data/Room";
import Filter, {ApplyFilter} from "@/lib/data/Filter";
import PendingAlert from "@/components/ui/PendingAlert/PendingAlert";
import {pendingFetch, usePendingAlert} from "@/components/ui/PendingAlert/usePendingAlert";
import {ReactNode, useEffect, useRef, useState} from "react";
import {googleTranslate} from "@/lib/import/GoogleTranslate";
import {buildAPILink} from "@/lib/api-client";
import {Button, ButtonGroup, Chip} from "@nextui-org/react";
import {MdModeEdit, MdOutlineCancel, MdOutlineCheck, MdOutlineTranslate, MdRepeat, MdSummarize} from "react-icons/md";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {Textarea} from "@nextui-org/input";
import {HiOutlineChatBubbleOvalLeftEllipsis} from "react-icons/hi2";
import {Card, CardBody} from "@nextui-org/card";
import ImageAsset from "@/lib/data/bot/ImageAsset";
import {buildImageLink} from "@/lib/data/Image";
import Persona from "@/lib/data/Persona";
import Summary, {reRollSummary} from "@/lib/data/Summary";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";

export interface ConversationBoxProps {
    room: Room | null,
    conversation: Conversation,
    updateConversation: (conversation: Conversation) => void,
    removeConversation: (conversation: Conversation) => void,
    isLast: boolean,
    filters: Filter[],
    imageAssets: ImageAsset[],
    displayOption: RoomDisplayOption,
    checkedToggles: string,
}

export default function ConversationBox(props: ConversationBoxProps) {
    const {
        room,
        conversation,
        updateConversation,
        removeConversation,
        isLast,
        filters,
        imageAssets,
        displayOption,
        checkedToggles
    } = props;

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

    const [summary, setSummary] = useState<Summary | undefined>(undefined)

    const switchSummaryView = async () => {
        if (!room) return;
        if (blockInSending.current) return;
        if (isInSummaryView) {
            rollbackPreventResize()
            setIsInSummaryView(false)
            return
        }
        preventResize()
        if (summary) {
            setIsInSummaryView(true)
            return
        }
        blockInSending.current = true;
        setIsInSending(true);

        try {
            setSummary(await pendingFetch(buildAPILink('room/' + room.id + `/summary/${conversation.id}`), pendingProps, {
                method: "GET"
            }, "요약 정보를 가져오고 있습니다..."))
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
            let data: Conversation;

            if (isInTranslateView) {
                data = await pendingFetch(buildAPILink(`room/${room.id}/conversation/put_translate/${conversation.id}`), pendingProps, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "assistant_message_translated": editingText
                    })
                }, "번역을 수정하고 있습니다...")
            } else {
                data = await pendingFetch(buildAPILink(`room/${room.id}/conversation/edit`), pendingProps, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "text": editingText
                    })
                }, "메시지를 수정하고 있습니다...")
            }
            updateConversation(data)
        } finally {
            blockInSending.current = false;
            setIsInSending(false);
            setIsInEditing(false);
            rollbackPreventResize();
        }
    }

    const imgPattern = /{{img::(.*?)}}/g;
    const quotePattern = /[“"]([\s\S]*?)[”"]/g;

    function applyWithPattern(text: string, pattern: RegExp, callback: (match: string, index: number, result: ReactNode[]) => void) {
        const parts = text.split(pattern);
        const result: ReactNode[] = [];

        for (let i = 0; i < parts.length; i++) {
            // 홀수 인덱스는 매칭된 데이터
            if (i % 2 === 1) {
                callback(parts[i].trim(), i, result)
            } else {
                // 짝수 인덱스는 매칭되지 않은 일반 데이터
                result.push(parts[i]);
            }
        }

        return result;
    }

    function applyImage(text: string) {
        return applyWithPattern(text, imgPattern, (assetName, i, result) => {
            const assets = imageAssets.filter(asset => {
                if (asset.name === assetName) return true;
                const alias = asset.alias.split(",").map(alias => alias.trim())
                return alias.includes(assetName);
            });
            if (assets.length === 0) {
                result.push(<Chip className={"block"} key={`unknown_image_${i}`} size={"sm"}>{assetName} - 없는 이미지
                    에셋</Chip>)
            } else {
                function seedRandom(seed: number) {
                    let currentSeed = seed;

                    // LCG 파라미터 (이 값들은 예시이며, 필요에 따라 조정 가능)
                    const a = 1664525;
                    const c = 1013904223;
                    const m = Math.pow(2, 32); // 32비트

                    currentSeed = (a * currentSeed + c) % m;
                    return currentSeed / m; // 0과 1 사이의 난수 반환
                }

                function getRandomInt(max: number) {
                    let seed = 0;
                    if (conversation.user_message) {
                        seed += conversation.user_message.length;
                    }
                    if (conversation.assistant_message) {
                        seed += conversation.assistant_message.length;
                    }
                    return Math.floor(seedRandom(seed) * max);
                }

                const asset = assets[getRandomInt(assets.length)];
                result.push(<img key={`img_${asset.name}_${i}`} src={buildImageLink(asset.imageId, 'display')}
                                 alt={asset.name}/>);
            }
        })
    }

    function applyQuoteHighlight(text: string) {
        return applyWithPattern(text, quotePattern, (match, i, result) => {
            result.push(<span className={"text-primary-500 font-medium"}
                              key={`quoted_${match}`}>&#34;{match}&#34;</span>)
        })
    }

    function applyDisplay(text: string) {
        let nodes = applyImage(text)

        if (displayOption.highlight_quoted_string) {
            nodes = nodes.map((node) => {
                if (typeof node === "string") {
                    return applyQuoteHighlight(node)
                }
                return node
            })
        }

        return <>{nodes}</>
    }

    function applyImageAndDisplayOption(text: string) {
        if (!displayOption.use_card) {
            return <span className={"whitespace-pre-line"}>{applyDisplay(text)}</span>
        }

        if (displayOption.use_card_split) {
            return <div className={"flex flex-col gap-2"}>
                {text.split("\n\n").map((line, index) => (line.trim() !== "" &&
                    <Card key={line + index} className={'w-fit'}>
                        <CardBody>
                            <div className={"whitespace-pre-line"}>{applyDisplay(line.trim())}</div>
                        </CardBody>
                    </Card>))}
            </div>
        } else {
            return <Card className={'w-fit'}>
                <CardBody>
                    <div className={"whitespace-pre-line"}>{applyDisplay(text.trim())}</div>
                </CardBody>
            </Card>
        }
    }

    function transformMessage(filters: Filter[], types: string[], text: string) {
        return applyImageAndDisplayOption(ApplyFilter(filters, types, text))
    }

    const getUserMessage = () => {
        if (!room) return "";
        if (isInTranslate && !room.translate_only_assistant) return transformMessage(filters, ["display", "display_final"], receivingUserMessage);
        if (conversation.user_message_translated && isInTranslateView && !room.translate_only_assistant) return transformMessage(filters, ["display", "display_final"], conversation.user_message_translated);
        if (conversation.user_message) return transformMessage(filters, ["display", "display_final"], conversation.user_message);
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
        if (!message.startsWith("<COT>") || !message.includes('</COT>')) return ["", applyImageAndDisplayOption(message)];
        const [cot, content] = message.split("</COT>")
        return [applyImageAndDisplayOption(cot.slice(5)), applyImageAndDisplayOption(content)]
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

    const articleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLast) {
            //TODO: Better way...
            setTimeout(() => {
                if (articleRef?.current) {
                    articleRef.current.scrollIntoView({behavior: "instant", block: "end"});
                }
            }, 16);
        }
    }, [conversation]);

    function preventResize() {
        if (!articleRef.current) return;
        articleRef.current.style.minHeight = `${articleRef.current.clientHeight}px`;
    }

    function rollbackPreventResize() {
        setTimeout(() => {
            if (!articleRef.current) return;
            articleRef.current.style.minHeight = ``;
        }, 500);
    }

    if (!room) return undefined

    function buildButtonGroup() {
        let inner: ReactNode[] = []

        if (isInEditing) {
            inner.push(<Button key={"editSaveButton"} startContent={<MdOutlineCheck size={"20"}/>}
                               onPress={editSelf}>저장</Button>)
            inner.push(<Button key={"editCancelButton"} startContent={<MdOutlineCancel size={"20"}/>} onPress={() => {
                rollbackPreventResize()
                setIsInEditing(false)
            }}>취소</Button>)
        }

        if (isLast && conversation.user_message) {
            inner.push(<Button key={"reRollButton"} aria-label={"리롤"} isIconOnly onPress={reRollSelf}><MdRepeat
                size={"20"}/></Button>)
        }

        if (isLast || isInTranslateView) {
            inner.push(<Button key={"editButton"} aria-label={isInTranslateView ? '번역수정' : '수정'} isIconOnly
                               onPress={() => {
                                   preventResize()
                                   if (isInTranslateView) {
                                       if (!conversation.assistant_message_translated) return;
                                       setEditingText(conversation.assistant_message_translated)
                                   } else {
                                       if (!conversation.assistant_message) return;
                                       setEditingText(conversation.assistant_message)
                                   }
                                   setIsInEditing(true)
                               }}><MdModeEdit size={"20"}/></Button>)
        }

        if (isLast && conversation.user_message) {
            inner.push(<DeleteConfirmButton key={"deleteButton"} confirmCount={2} onConfirmed={() => {
                revertSelf().then()
            }}/>)
        }

        if (!isLast) {
            inner.push(<Button key={"summaryButton"} color={isInSummaryView ? 'primary' : undefined}
                               onPress={switchSummaryView} isIconOnly><MdSummarize
                size={"20"}/></Button>)
        }

        if (isInSummaryView) {
            inner.push(<AsyncProgressButton key={"reRollButton"} aria-label={"리롤"} isIconOnly
                                            onPressAsync={async () => {
                                                setSummary(await reRollSummary(conversation))
                                            }}><MdRepeat
                size={"20"}/></AsyncProgressButton>)
        }

        if (room?.translate_method && !isInSummaryView && !isInEditing) {
            if (isInTranslateView) {
                inner.push(<Button key={"reTranslateButton"} startContent={<MdRepeat size={"20"}/>}
                                   onPress={translateSelf}>다시 번역</Button>)
                inner.push(<Button key={"disableTranslateViewButton"} aria-label={"번역"} disableAnimation isIconOnly
                                   onPress={switchTranslate}><MdOutlineTranslate color={"green"}
                                                                                 size={20}/></Button>)
            } else {
                inner.push(<Button key={"enableTranslateViewButton"} aria-label={"번역"} disableAnimation
                                   onPress={switchTranslate}
                                   isIconOnly><MdOutlineTranslate size={20}/></Button>)
            }
        }

        if (inner.length === 0) return <></>

        return <ButtonGroup isDisabled={isInSending} variant={"ghost"}>
            <>{inner}</>
        </ButtonGroup>
    }

    function getDisplayName(persona: Persona | undefined) {
        if (!persona) return ''
        if (persona.displayName && persona.displayName.length !== 0) return persona.displayName
        return persona.name
    }

    if (isInSummaryView) {
        const buttonGroup = buildButtonGroup();

        return <article ref={articleRef} className={"flex flex-col gap-4 relative"}>
            <div className={"w-full flex flex-row gap-2 justify-start"}>
                <span className={"self-center"}>요약 보기</span>
                {buttonGroup}
            </div>
            {isInEditing ?
                <Textarea value={editingText} maxRows={9999} onChange={(e) => setEditingText(e.target.value)}/>
                : <span>
                {summary?.content}
            </span>}
            <PendingAlert {...pendingProps} />
            <div className={"absolute bottom-0 w-full flex flex-row gap-2 justify-end"}>
                {buttonGroup}
            </div>
        </article>
    }

    return <article ref={articleRef} className={"flex flex-col gap-4"}>
        {conversation.user_message &&
            <MessageBox message={getUserMessage()} name={getDisplayName(room.persona)}
                        profileImageId={room.persona?.profileImageId}/>}
        {conversation.assistant_message && <>
            {!isInSummaryView && !isInEditing &&
                <MessageBox message={displayCOT ? assistantCOT : assistantContent}
                            extraNode={assistantCOT && <button onClick={() => {
                                setDisplayCOT(!displayCOT)
                            }}>
                                <HiOutlineChatBubbleOvalLeftEllipsis size={"24"}/>
                            </button>} name={getDisplayName(room.bot)}
                            profileImageId={room.bot?.profileImageId}/>}
            {isInEditing &&
                <Textarea value={editingText} maxRows={9999}
                          onChange={(e) => setEditingText(e.target.value)}/>}
        </>}
        <div className={"w-full flex flex-row gap-2 justify-end"}>
            {buildButtonGroup()}
        </div>
        <PendingAlert {...pendingProps} />
    </article>
}