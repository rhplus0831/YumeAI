import PromptList from "./PromptList.tsx";
import * as React from "react";
import {Box, Grid, GridItem} from "@chakra-ui/react";
import Prompt from "./Prompt.ts";
import PromptEditorBox from "../Base/PromptEditorBox";
import {getAPIServer} from "../../Configure";
import PromptSidebar from "./PromptSidebar.tsx";

export default function PromptAppContainer() {
    const [selectedPrompt, setSelectedPrompt] = React.useState<Prompt | null>(null);
    const [prompts, setPrompts] = React.useState<Prompt[]>([]);

    const changeSelectedPrompt = (selectedPrompt: Prompt) => {
        const newPrompts = prompts.map((item: Prompt) => {
            if (item.id == selectedPrompt.id) {
                return selectedPrompt;
            } else {
                return item;
            }
        })

        setPrompts(newPrompts)
        setSelectedPrompt(selectedPrompt)
    }

    return (
        <Box height={'calc(100vh - 48px)'}
             maxHeight={'calc(100vh - 48px)'}>
            <Grid
                gridTemplateRows={'1fr'}
                gridTemplateColumns={'300px 1fr'} h={'inherit'} maxHeight={'inherit'} gap={4}
                paddingBottom="16px">
                <GridItem w='300px' h={'inherit'} maxH={'inherit'}>
                    <PromptList prompts={prompts} setPrompts={setPrompts} selectedPrompt={selectedPrompt}
                                setSelectedPrompt={setSelectedPrompt} selectButtonText={'수정하기'}></PromptList>
                    <PromptSidebar selectedPrompt={selectedPrompt} setSelectedPrompt={setSelectedPrompt} onEdited={(data: Prompt) => {
                        changeSelectedPrompt(data)
                    }}></PromptSidebar>
                </GridItem>
                <GridItem w='100%' h={'inherit'} maxH={'inherit'}>
                    <PromptEditorBox item={selectedPrompt} display={selectedPrompt !== null}
                                     endpoint={selectedPrompt !== null ? getAPIServer() + 'prompt/' + selectedPrompt.id : ''}
                                     onPromptSaved={(prompt: string) => {
                                         if (selectedPrompt === null) return
                                         selectedPrompt.prompt = prompt
                                         changeSelectedPrompt(selectedPrompt)
                                     }}></PromptEditorBox>
                </GridItem>
            </Grid>
        </Box>
    )
}