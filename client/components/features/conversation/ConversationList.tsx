import Conversation from "@/lib/data/Conversation";
import ConversationBox from "@/components/features/conversation/ConversationBox";
import Room, {getConversations} from "@/lib/data/Room";
import {useEffect, useMemo, useRef, useState} from "react";
import {Button, CircularProgress} from "@nextui-org/react";
import {StreamData} from "@/lib/data/StreamData";
import {pendingFetch, usePendingAlert} from "@/components/ui/PendingAlert/usePendingAlert";
import {buildAPILink} from "@/lib/api-client";
import PendingAlert from "@/components/ui/PendingAlert/PendingAlert";
import {Textarea} from "@nextui-org/input";
import Filter from "@/lib/data/Filter";

export default function ConversationList({room}: {
    room: Room,
}) {
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [conversations, setConversations] = useState<Conversation[]>([])

    let [filters, setFilters] = useState<Filter[]>([])
    useEffect(() => {
        if (!room) return
        let making: Filter[] = []
        if (room.prompt?.filters) {
            making = making.concat(JSON.parse(room.prompt.filters))
        }
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

    const sending = useRef(false);
    const [userMessage, setUserMessage] = useState<string>("");
    const pendingAlertProps = usePendingAlert()

    const sendMessage = async () => {
        if (!room) {
            return
        }
        if (sending.current) {
            return
        }
        sending.current = true;
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
            const data = await pendingFetch(buildAPILink('room/' + room.id + '/conversation/send'), pendingAlertProps, {
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
        sending.current = false;
    }

    useEffect(() => {
        async function loader() {
            //TODO: 에러 핸들링
            setConversations(await getConversations(room))
            setIsLoading(false)
        }

        loader().then()
    }, [room])

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

    return <section className={"w-full h-full relative flex flex-col gap-4"}>
        {isLoading && <CircularProgress size={"lg"} label={"기존 대화를 불러오는중..."}
                                        className={"absolute top-0 left-0 right-0 bottom-0 m-auto"}/>}
        <section className={"flex-1 overflow-y-scroll flex flex-col gap-4 pr-4"}>
            {cachedConversations}
        </section>
        <div className={"flex-0 flex pb-2"}>
            <PendingAlert {...pendingAlertProps}/>
            <div className={"flex flex-row w-full gap-2"}>
                <Textarea className={"flex-1"} minRows={1} maxRows={9999} size={"sm"} value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}/>
                <Button className={"flex-none h-full"} onPress={sendMessage}>보내기</Button>
            </div>
        </div>
    </section>
}