import React from "react";
import {Box, Button, Text} from "@chakra-ui/react";
import Room from "./Room";
import BotSelectBox from "../Bot/BotSelectBox";
import {getAPIServer} from "../../Configure";
import PersonaSelectBox from "../Persona/PersonaSelectBox";
import Bot from "../Bot/Bot";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import BaseData from "../Base/BaseData.ts";

export default function RoomSidebar({selectedRoom, setSelectedRoom, onEdited}: {
    selectedRoom: Room | null,
    setSelectedRoom: React.Dispatch<React.SetStateAction<Room | null>>,
    onEdited: (data: Room) => void
}) {
    const [name, setName] = React.useState("");

    React.useEffect(() => {
        if (selectedRoom === null) return
        setName(selectedRoom.name)
    }, [selectedRoom])

    return (
        <Box display={selectedRoom !== null ? "block" : "none"}>
            <Button onClick={() => {
                setSelectedRoom(null)
            }}>돌아가기</Button>
            <Text>방 이름</Text>
            <AutoSubmitEditable endpoint={getAPIServer() + 'room/' + selectedRoom?.id} valueName={'name'} value={name}
                                setValue={(name: string) => {
                                    if (selectedRoom === null) return
                                    setName(name)
                                }} onEdited={onEdited}></AutoSubmitEditable>
            <Text>페르소나</Text>
            <PersonaSelectBox
                persona={selectedRoom !== null && selectedRoom.persona !== undefined ? selectedRoom.persona : null}
                onSelected={async (persona: BaseData, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                    if (selectedRoom === null) return
                    try {
                        onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                            method: 'PUT',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                'persona_id': persona.id,
                            })
                        }, '페르소나 선택중...') as Room)
                    } catch { /* empty */
                    }
                }}></PersonaSelectBox>
            <Text>봇</Text>
            <BotSelectBox bot={selectedRoom !== null && selectedRoom.bot !== undefined ? selectedRoom.bot : null}
                          onSelected={async (bot: Bot, notifyFetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<BaseData>) => {
                              if (selectedRoom === null) return
                              try {
                                  onEdited(await notifyFetch(getAPIServer() + 'room/' + selectedRoom.id, {
                                      method: 'PUT',
                                      headers: {
                                          "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                          'bot_id': bot.id,
                                      })
                                  }, '봇 선택중...') as Room)
                              } catch { /* empty */
                              }
                          }}></BotSelectBox>
        </Box>
    )
}
