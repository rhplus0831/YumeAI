import React from "react";
import {Grid, GridItem, IconButton, Text} from "@chakra-ui/react";
import Prompt from "./Prompt.ts";
import {getAPIServer} from "../../Configure";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import {ArrowBackIcon} from "@chakra-ui/icons";

export default function PromptSidebar({selectedPrompt, setSelectedPrompt, onEdited}: {
    selectedPrompt: Prompt | null,
    setSelectedPrompt: (persona: Prompt | null) => void,
    onEdited: (data: Prompt) => void
}) {
    const [name, setName] = React.useState("");

    React.useEffect(() => {
        if (selectedPrompt === null) return

        setName(selectedPrompt.name)
    }, [selectedPrompt])

    return (
        <Grid display={selectedPrompt !== null ? "grid" : "none"} templateRows={'auto auto auto auto'}>
            <GridItem>
                <IconButton aria-label={'Back'} icon={<ArrowBackIcon></ArrowBackIcon>} onClick={() => {
                    setSelectedPrompt(null)
                }}></IconButton>
                <Text>프롬프트 이름</Text>
                <AutoSubmitEditable
                    endpoint={selectedPrompt !== null ? getAPIServer() + 'prompt/' + selectedPrompt.id : ''}
                    valueName={'name'} value={name} setValue={setName} onEdited={onEdited}></AutoSubmitEditable>
            </GridItem>
        </Grid>
    )
}