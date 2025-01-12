"use client";

import YumeMenu from "@/components/MenuPortal";
import {useState} from "react";
import SubmitSpan from "@/components/ui/SubmitSpan";
import PromptTextarea from "@/components/ui/PromptTextarea";
import UploadableAvatar from "@/components/features/profileImage/UploadableAvatar";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import Bot, {deleteBot, putBot} from "@/lib/data/Bot";
import {Checkbox} from "@nextui-org/react";

export default function BotViewer({startBot}: { startBot: Bot }) {
    const router = useRouter()

    const [bot, setBot] = useState<Bot>(startBot)
    const [isEditingFirstMessage, setIsEditingFirstMessage] = useState<boolean>(false)
    const [status, setStatus] = useState<string>("normal")

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
            <PromptTextarea setStatus={setStatus} title={"퍼스트 메시지"} prompt={bot.first_message} onSave={async (text) => {
                setBot(await putBot(bot.id, {
                    first_message: text
                }))
            }}/>
            : <PromptTextarea setStatus={setStatus} title={"프롬프트"} prompt={bot.prompt} onSave={async (text) => {
            setBot(await putBot(bot.id, {
                prompt: text
            }))
        }}/>}
    </>
}