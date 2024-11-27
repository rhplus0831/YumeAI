import {FormControl, FormLabel, Input} from "@chakra-ui/react";
import React from "react";
import BotBox from "./BotBox";
import BaseList from "../Base/BaseList";
import Bot from "./Bot";

export default function BotList({selectedBot, setSelectedBot, bots, setBots, selectButtonText}: {
    selectedBot: Bot | null,
    setSelectedBot: (bot: Bot | null) => void,
    bots: Bot[],
    setBots: React.Dispatch<React.SetStateAction<Bot[]>>,
    selectButtonText: string
}) {
    const [name, setName] = React.useState("");
    const [displayName, setDisplayName] = React.useState("");


    return (
        <BaseList<Bot> display={selectedBot === null} items={bots} setItems={setBots} displayName={'봇'} endpoint={'bot/'} createBox={(bot) => (
            <BotBox bot={bot} setSelectedBot={setSelectedBot} key={bot.id} selectButtonText={selectButtonText}></BotBox>)}
                  createForm={(initialRef) => (
                      <FormControl>
                          <FormLabel>봇 이름</FormLabel>
                          <Input ref={initialRef} value={name} onChange={(event) => {
                              setName(event.target.value)
                          }} placeholder='봇 이름'/>
                          <FormLabel>봇 닉네임</FormLabel>
                          <Input value={displayName} onChange={(event) => {
                              setDisplayName(event.target.value)
                          }} placeholder='봇 닉네임'/>
                      </FormControl>
                  )} createItemJson={() => {
            return JSON.stringify({
                'name': name,
                'displayName': displayName,
                'prompt': ''
            })
        }}>

        </BaseList>
    )
}