"use client";

import Room, {deleteRoom, putRoom, RoomDisplayOption} from "@/lib/data/Room";
import YumeMenu from "@/components/MenuPortal";
import {Checkbox, Divider, SelectItem} from "@nextui-org/react";
import {useEffect, useState} from "react";
import SelectablePersonaCardWithModal from "@/components/features/persona/SelectablePersonaCardWithModal";
import SelectablePromptCardWithModal from "@/components/features/prompt/SelectablePromptCardWithModal";
import AsyncProgressSelect from "@/components/ui/AsyncProgressSelect";
import ConversationList from "@/components/features/room/conversation/ConversationList";
import PromptToggleSelect from "@/components/features/prompt/toggle/PromptToggleSelect";
import AsyncProgressCheckbox from "@/components/ui/AsyncProgressCheckbox";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {useRouter} from "next/navigation";
import YumeCustomNav from "@/components/CustomNavPortal";
import YumeAvatar from "@/components/ui/YumeAvatar";
import SubmitSpan from "@/components/ui/SubmitSpan";
import {buildImageLink} from "@/lib/data/Image";
import ExportButton from "@/components/features/ExportButton";
import RoomOperationLogQueryButton from "@/components/features/log/RoomOperationLogQueryButton";

export default function RoomViewer({startRoom}: { startRoom: Room }) {
    const router = useRouter()

    const [room, setRoom] = useState<Room>(startRoom)
    const [checkedToggles, setCheckedToggles] = useState("")
    let [displayOption, setDisplayOption] = useState<RoomDisplayOption>({
        use_card: undefined,
        use_card_split: undefined,
        highlight_quoted_string: undefined,
    })

    useEffect(() => {
        if (room.display_option) {
            try {
                setDisplayOption(JSON.parse(room.display_option))
            } catch {
                setDisplayOption({
                    use_card: undefined,
                    use_card_split: undefined,
                    highlight_quoted_string: undefined,
                })
            }
        }
    }, [room])

    const [backupType, setBackupType] = useState<"room" | "room_and_chat">("room")

    return (<>
        <YumeCustomNav>
            {room.bot ? <div className={"flex flex-row gap-2 items-center w-full"}>
                <YumeAvatar className={"flex-0"} src={buildImageLink(room.bot.profileImageId, "avatar")} />
                <span className={"flex-1 overflow-hidden overflow-ellipsis"}>{room.bot.displayName ? room.bot.displayName : room.bot.name}</span>
            </div> : undefined}
        </YumeCustomNav>
        <YumeMenu>
            <div className={"flex flex-col p-2 gap-1"}>
                <div className={"text-lg"}>
                    <SubmitSpan label={'방 이름'} value={room.name} submit={async (value) => {
                        setRoom(await putRoom(room.id, {"name": value}))
                    }}/>
                </div>
                <Divider/>
                <span>페르소나</span>
                <SelectablePersonaCardWithModal onSelect={async (persona) => {
                    setRoom(await putRoom(room.id, {"persona_id": persona.id}))
                }} persona={room.persona} endpoint={"persona?"}/>
                <span>봇</span>
                <SelectablePersonaCardWithModal displayName={"봇"} onSelect={async (bot) => {
                    setRoom(await putRoom(room.id, {"bot_id": bot.id}))
                }} persona={room.bot} endpoint={"bot?"}/>
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
                <span>입력 추천용 프롬프트</span>
                <SelectablePromptCardWithModal onSelect={async (prompt) => {
                    setRoom(await putRoom(room.id, {"suggest_prompt_id": prompt.id}))
                }} filterType={"suggest"} prompt={room.suggest_prompt}/>
                <span>표시 옵션</span>
                <AsyncProgressCheckbox isSelected={displayOption.use_card} onValueChangeAsync={async (value) => {
                    const json = room.display_option ? JSON.parse(room.display_option) : {}
                    json['use_card'] = value;
                    setRoom(await putRoom(room.id, {"display_option": JSON.stringify(json)}))
                }}>
                    메시지를 카드로 감싸기
                </AsyncProgressCheckbox>
                <AsyncProgressCheckbox isSelected={displayOption.use_card_split} onValueChangeAsync={async (value) => {
                    const json = room.display_option ? JSON.parse(room.display_option) : {}
                    json['use_card_split'] = value;
                    setRoom(await putRoom(room.id, {"display_option": JSON.stringify(json)}))
                }}>
                    두번 개행 되었을때 카드를 나누기
                </AsyncProgressCheckbox>
                <AsyncProgressCheckbox isSelected={displayOption.highlight_quoted_string}
                                       onValueChangeAsync={async (value) => {
                                           const json = room.display_option ? JSON.parse(room.display_option) : {}
                                           json['highlight_quoted_string'] = value;
                                           setRoom(await putRoom(room.id, {"display_option": JSON.stringify(json)}))
                                       }}>
                    &#34;대화&#34;를 강조하기
                </AsyncProgressCheckbox>
                <ExportButton export_type={'room'} export_id={room.id} label={'채팅방 백업하기'}/>
                <Checkbox isSelected={backupType === "room_and_chat"} onValueChange={async (checked) => {
                    setBackupType(checked ? "room_and_chat" : "room")
                }}>채팅 내역까지 백업하기</Checkbox>
                <span className={"text-xs text-foreground-600"}>
                    이 방이 사용하고 있는 페르소나 등 관련 데이터(API 키 제외)가 한꺼번에 백업됩니다.
                    <br/>암호화가 풀린 상태로 저장되므로 암호화가 필요한경우 별도로 암호화 해주세요.
                </span>
                <RoomOperationLogQueryButton room={room}/>
                <DeleteConfirmButton className={"mt-10"} confirmCount={5} onConfirmed={async () => {
                    await deleteRoom(room.id)
                    router.replace("/rooms")
                }}/>
            </div>
        </YumeMenu>
        <ConversationList room={room} displayOption={displayOption} checkedToggles={checkedToggles}/>
    </>)
}