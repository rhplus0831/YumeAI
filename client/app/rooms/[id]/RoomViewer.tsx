"use client";

import Room, {deleteRoom, putRoom} from "@/lib/data/Room";
import YumeMenu from "@/components/MenuPortal";
import {Divider, SelectItem} from "@nextui-org/react";
import {useState} from "react";
import SelectablePersonaCardWithModal from "@/components/features/persona/SelectablePersonaCardWithModal";
import {getBots} from "@/lib/data/Bot";
import {getPersonas} from "@/lib/data/Persona";
import SelectablePromptCardWithModal from "@/components/features/prompt/SelectablePromptCardWithModal";
import AsyncProgressSelect from "@/components/ui/AsyncProgressSelect";
import ConversationList from "@/components/features/conversation/ConversationList";
import PromptToggleSelect from "@/components/features/prompt/toggle/PromptToggleSelect";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import YumeCustomNav from "@/components/CustomNavPortal";
import YumeAvatar from "@/components/ui/YumeAvatar";
import {buildImageLink} from "@/lib/api-client";

export default function RoomViewer({startRoom}: { startRoom: Room }) {
    const router = useRouter()

    const [room, setRoom] = useState<Room>(startRoom)
    const [checkedToggles, setCheckedToggles] = useState("")

    return (<>
        <YumeCustomNav>
            {room.bot ? <div className={"flex flex-row gap-2 items-center w-full"}>
                <YumeAvatar className={"flex-0"} src={buildImageLink(room.bot.profileImageId, "avatar")} />
                <span className={"flex-1 overflow-hidden overflow-ellipsis"}>{room.bot.displayName ?? room.bot.name}</span>
            </div> : undefined}
        </YumeCustomNav>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-1"}>
                <span className={"text-lg"}>{room.name}</span>
                <Divider/>
                <span>페르소나</span>
                <SelectablePersonaCardWithModal onSelect={async (persona) => {
                    setRoom(await putRoom(room.id, {"persona_id": persona.id}))
                }} persona={room.persona} fetchPersona={getPersonas}/>
                <span>봇</span>
                <SelectablePersonaCardWithModal displayName={"봇"} onSelect={async (bot) => {
                    setRoom(await putRoom(room.id, {"bot_id": bot.id}))
                }} persona={room.bot} fetchPersona={getBots}/>
                <span>프롬프트</span>
                <SelectablePromptCardWithModal onSelect={async (prompt) => {
                    setRoom(await putRoom(room.id, {"prompt_id": prompt.id}))
                }} filterType={"chat"} prompt={room.prompt}/>
                {room.prompt && <PromptToggleSelect prompt={room.prompt} setCheckedToggles={setCheckedToggles}/>}
                <span>요약용 프롬프트</span>
                <SelectablePromptCardWithModal onSelect={async (prompt) => {
                    setRoom(await putRoom(room.id, {"summary_prompt_id": prompt.id}))
                }} filterType={"summary"} prompt={room.summary_prompt}/>
                <span>재 요약용 프롬프트</span>
                <SelectablePromptCardWithModal onSelect={async (prompt) => {
                    setRoom(await putRoom(room.id, {"re_summary_prompt_id": prompt.id}))
                }} filterType={"re_summary"} prompt={room.re_summary_prompt}/>
                <span>번역 방법</span>
                <AsyncProgressSelect selectedKeys={[room.translate_method ? room.translate_method : '']}
                                     onValueChangeAsync={async (value) => {
                                         setRoom(await putRoom(room.id, {"translate_method": value}))
                                     }}>
                    <SelectItem key={""}>없음</SelectItem>
                    <SelectItem key={"google"}>구글</SelectItem>
                    <SelectItem key={"prompt"}>프롬프트</SelectItem>
                </AsyncProgressSelect>
                {room.translate_method && <AsyncProgressCheckbox isSelected={room.translate_only_assistant}
                                                                 onValueChangeAsync={async (value) => {
                                                                     setRoom(await putRoom(room.id, {"translate_only_assistant": value}))
                                                                 }}>
                    봇의 메시지만 번역하기
                </AsyncProgressCheckbox>}
                {
                    room.translate_method === "prompt" && <>
                        <span>번역용 프롬프트</span>
                        <SelectablePromptCardWithModal onSelect={async (prompt) => {
                            setRoom(await putRoom(room.id, {"translate_prompt_id": prompt.id}))
                        }} filterType={"translate"} prompt={room.translate_prompt}/>
                    </>
                }
                <DeleteConfirmButton className={"mt-10"} confirmCount={5} onConfirmed={async () => {
                    await deleteRoom(room.id)
                    router.replace("/rooms")
                }}/>
            </div>
        </YumeMenu>
        <ConversationList room={room} checkedToggles={checkedToggles}/>
    </>)
}