"use client";

import YumeMenu from "@/components/MenuPortal";
import {useEffect, useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import PromptTextarea from "@/components/ui/PromptTextarea";
import UploadableAvatar from "@/components/features/profileImage/UploadableAvatar";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import Bot, {deleteBot, putBot} from "@/lib/data/Bot";
import {Button, Checkbox, Select, SelectItem} from "@nextui-org/react";
import FirstMessage from "@/lib/data/FirstMessage";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";

function simpleStringHash(str: string) {
    var hash = 0,
        i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export default function BotViewer({startBot}: { startBot: Bot }) {
    const router = useRouter()

    const [bot, setBot] = useState<Bot>(startBot)
    const [isEditingFirstMessage, setIsEditingFirstMessage] = useState<boolean>(false)
    const [status, setStatus] = useState<string>("normal")

    const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([])
    const [selectedFirstMessage, setSelectedFirstMessage] = useState<string>("")

    const [queuedFirstMessage, setQueuedFirstMessage] = useState<string>("")

    useEffect(() => {
        let data: FirstMessage[] = [{
            "name": "기본",
            "message": "",
            id: simpleStringHash("기본")
        }]
        if (bot.first_message) {
            try {
                data = JSON.parse(bot.first_message)
            } catch {

            }
        }
        if(queuedFirstMessage) {
            setSelectedFirstMessage(queuedFirstMessage)
        } else {
            setSelectedFirstMessage(data[0].name)
        }

        setFirstMessages(data)

    }, [bot])

    return <>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-1"}>
                <SubmitSpan value={bot.name} label={"봇 이름"} submit={async (value) => {
                    setBot(await putBot(bot.id, {
                        name: value
                    }))
                }}/>
                <SubmitSpan value={bot.displayName} label={"봇 닉네임"} submit={async (value) => {
                    setBot(await putBot(bot.id, {
                        displayName: value
                    }))
                }}/>
                <UploadableAvatar profileImageId={bot.profileImageId}
                                  endpoint={`bot/${bot.id}/profile_image`} onEdited={(data: Bot) => {
                    setBot(data)
                }}/>
                {status !== "normal" && <span className={"text-xs"}>프롬프트를 저장하기 전까지 변경할 수 없습니다.</span>}
                <Checkbox isDisabled={status !== "normal"} checked={isEditingFirstMessage} onValueChange={(value) => {
                    setIsEditingFirstMessage(value)
                }}>
                    첫 메시지 수정하기
                </Checkbox>
                <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                    await deleteBot(bot.id)
                    router.replace("/bots")
                }}/>
            </div>
        </YumeMenu>
        {isEditingFirstMessage ?
            <>
                <div className={"flex flex-col gap-1 h-full"}>
                    <div className={"flex flex-row"}>
                        <Select disallowEmptySelection selectedKeys={[selectedFirstMessage]} onChange={(event) => {
                            setSelectedFirstMessage(event.target.value)
                        }}>
                            {firstMessages.map((item) => (<SelectItem key={item.name}>{item.name}</SelectItem>))}
                        </Select>
                        <AsyncProgressButton onPressAsync={async () => {
                            firstMessages.forEach((item) => {
                                if(item.name === '새 첫 메시지') {
                                    throw new Error("최근에 생성한 첫 메시지의 이름을 바꿔주세요.")
                                }
                            })

                            const newData = [...firstMessages, {
                                "name": "새 첫 메시지",
                                "message": "",
                                "id": simpleStringHash("새 첫 메시지")
                            }]

                            setBot(await putBot(bot.id, {
                                first_message: JSON.stringify(newData)
                            }))
                            setQueuedFirstMessage("새 첫 메시지")
                        }}>
                            추가하기
                        </AsyncProgressButton>
                        <DeleteConfirmButton confirmCount={3} onConfirmed={async () => {
                            const newData = firstMessages.filter((item) => item.name !== selectedFirstMessage)
                            setBot(await putBot(bot.id, {
                                first_message: JSON.stringify(newData)
                            }))
                        }} />
                    </div>
                    <SubmitSpan value={selectedFirstMessage ?? ''} label={"첫 메시지 이름"} submit={async (value) => {
                        firstMessages.forEach((item) => {
                            if(item.name === value) {
                                throw new Error("이미 동일한 이름의 첫 메시지가 존재합니다.")
                            }
                        })

                        const newData = firstMessages.map((item) => {
                            if(item.name === selectedFirstMessage) {
                                return {
                                    "name": value,
                                    "id": simpleStringHash(value),
                                    "message": item.message
                                }
                            }
                            return item
                        })
                        setBot(await putBot(bot.id, {
                            first_message: JSON.stringify(newData)
                        }))
                        setQueuedFirstMessage(value)
                    }} />
                    <PromptTextarea setStatus={setStatus} title={"첫 메시지"} prompt={firstMessages.find((item) => item.name === selectedFirstMessage)?.message ?? ""}
                                    onSave={async (text) => {
                                        const newData = firstMessages.map((item) => {
                                            if(item.name === selectedFirstMessage) {
                                                return {
                                                    "name": item.name,
                                                    "id": item.id,
                                                    "message": text
                                                }
                                            }
                                            return item
                                        })
                                        setBot(await putBot(bot.id, {
                                            first_message: JSON.stringify(newData)
                                        }))
                                        setQueuedFirstMessage(selectedFirstMessage)
                                    }}/>
                </div>
            </>
            : <PromptTextarea setStatus={setStatus} title={"프롬프트"} prompt={bot.prompt} onSave={async (text) => {
                setBot(await putBot(bot.id, {
                    prompt: text
                }))
            }}/>}
    </>
}