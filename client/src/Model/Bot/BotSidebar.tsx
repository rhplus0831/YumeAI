import React from "react";
import {Checkbox, Grid, GridItem, IconButton, Text} from "@chakra-ui/react";
import Bot from "./Bot";
import {getAPIServer} from "../../Configure";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import UploadableProfileBox from "../Base/UploadableProfileBox";
import {ArrowBackIcon} from "@chakra-ui/icons";

export default function BotSidebar({selectedBot, setSelectedBot, onEdited, isEditingFirstMessage, setIsEditingFirstMessage}: {
    selectedBot: Bot | null,
    setSelectedBot: (bot: Bot | null) => void,
    onEdited: (data: Bot) => void,
    isEditingFirstMessage: boolean,
    setIsEditingFirstMessage: (editing: boolean) => void
}) {
    const [name, setName] = React.useState("");
    const [displayName, setDisplayName] = React.useState("");

    React.useEffect(() => {
        if (selectedBot === null) return

        setName(selectedBot.name)
        setDisplayName(selectedBot.displayName)
    }, [selectedBot])

    return (
        <Grid display={selectedBot !== null ? "grid" : "none"} templateRows={'auto auto auto auto'}>
            <GridItem>
                <IconButton aria-label={'Back'} icon={<ArrowBackIcon></ArrowBackIcon>} onClick={() => {
                    setSelectedBot(null)
                }}></IconButton>
                <Text>봇 아이콘</Text>
                <UploadableProfileBox endpoint={getAPIServer() + 'bot/' + selectedBot?.id + '/profile_image'}
                                      onEdited={onEdited} selected={selectedBot}></UploadableProfileBox>
            </GridItem>
            <GridItem>
                <Text>봇 이름</Text>
                <AutoSubmitEditable
                    endpoint={selectedBot !== null ? getAPIServer() + 'bot/' + selectedBot.id : ''}
                    valueName={'name'} value={name} setValue={setName} onEdited={onEdited}></AutoSubmitEditable>
            </GridItem>
            <GridItem>
                <Text>봇 닉네임</Text>
                <AutoSubmitEditable
                    endpoint={selectedBot !== null ? getAPIServer() + 'bot/' + selectedBot.id : ''}
                    valueName={'displayName'} value={displayName} setValue={setDisplayName}
                    onEdited={onEdited}></AutoSubmitEditable>
            </GridItem>
            <GridItem>
                <Checkbox isChecked={isEditingFirstMessage} onChange={(event) => {
                    setIsEditingFirstMessage(event.target.checked)
                }} >첫 메시지 수정하기</Checkbox>
            </GridItem>
        </Grid>
    )
}