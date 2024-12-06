import BotList from "./BotList";
import * as React from "react";
import {Box, Grid, GridItem} from "@chakra-ui/react";
import Bot from "./Bot";
import PromptEditorBox from "../Base/PromptEditorBox";
import {getAPIServer} from "../../Configure";
import BotSidebar from "./BotSidebar";

export default function BotAppContainer() {
    const [selectedBot, setSelectedBot] = React.useState<Bot | null>(null);
    const [bots, setBots] = React.useState<Bot[]>([]);

    const [isEditingFirstMessage, setIsEditingFirstMessage] = React.useState<boolean>(false)

    const refreshSelectedBot = () => {
        const newBots = bots.map((item: Bot) => {
            if (item.id == selectedBot?.id) {
                return selectedBot;
            } else {
                return item;
            }
        })

        setBots(newBots)
    }

    return (
        <Box height={'calc(100vh - 48px)'}
             maxHeight={'calc(100vh - 48px)'}>
            <Grid
                gridTemplateRows={'1fr'}
                gridTemplateColumns={'300px 1fr'} h={'inherit'} maxHeight={'inherit'} gap={4}
                paddingBottom="16px">
                <GridItem w='300px' h={'inherit'} maxH={'inherit'}>
                    <BotList bots={bots} setBots={setBots} selectedBot={selectedBot}
                             setSelectedBot={setSelectedBot} selectButtonText={'수정하기'}></BotList>
                    <BotSidebar selectedBot={selectedBot} setSelectedBot={setSelectedBot} onEdited={(data: Bot) => {
                        if (selectedBot === null) return
                        selectedBot.id = data.id
                        selectedBot.displayName = data.displayName
                        selectedBot.profileImageId = data.profileImageId
                        refreshSelectedBot()
                    }} isEditingFirstMessage={isEditingFirstMessage}
                                setIsEditingFirstMessage={setIsEditingFirstMessage}></BotSidebar>
                </GridItem>
                <GridItem w='100%' h={'inherit'} maxH={'inherit'}>
                    <PromptEditorBox item={selectedBot} display={selectedBot !== null && isEditingFirstMessage}
                                     endpoint={selectedBot !== null ? getAPIServer() + 'bot/' + selectedBot.id : ''}
                                     onPromptSaved={(prompt: string) => {
                                         if (selectedBot === null) return
                                         selectedBot.first_message = prompt
                                         refreshSelectedBot()
                                     }}
                                     customData={(prompt) => {
                                         return {"first_message": prompt}
                                     }}
                                     getCustomResult={(raw) => {
                                         const data = raw as Bot
                                         return data.first_message
                                     }}
                                     customTitle={"퍼스트 메시지"}></PromptEditorBox>
                    <PromptEditorBox item={selectedBot} display={selectedBot !== null && !isEditingFirstMessage}
                                     endpoint={selectedBot !== null ? getAPIServer() + 'bot/' + selectedBot.id : ''}
                                     onPromptSaved={(prompt: string) => {
                                         if (selectedBot === null) return
                                         selectedBot.prompt = prompt
                                         refreshSelectedBot()
                                     }}></PromptEditorBox>
                </GridItem>
            </Grid>
        </Box>
    )
}