import React from "react";
import {Grid, GridItem, IconButton, Text} from "@chakra-ui/react";
import Persona from "./Persona";
import {getAPIServer} from "../../Configure";
import AutoSubmitEditable from "../Base/AutoSubmitEditable";
import UploadableProfileBox from "../Base/UploadableProfileBox";
import {ArrowBackIcon} from "@chakra-ui/icons";

export default function PersonaSidebar({selectedPersona, setSelectedPersona, onEdited}: { selectedPersona: Persona | null, setSelectedPersona: (persona: Persona | null) => void, onEdited: (data: Persona) => void }) {
    const [name, setName] = React.useState("");
    const [displayName, setDisplayName] = React.useState("");

    React.useEffect(() => {
        if (selectedPersona === null) return

        setName(selectedPersona.name)
        setDisplayName(selectedPersona.displayName)
    }, [selectedPersona])

    return (
        <Grid display={selectedPersona !== null ? "grid" : "none"} templateRows={'auto auto auto auto'}>
            <GridItem>
                <IconButton aria-label={'Back'} icon={<ArrowBackIcon></ArrowBackIcon>} onClick={() => {setSelectedPersona(null)}}></IconButton>
                <Text>페르소나 아이콘</Text>
                <UploadableProfileBox endpoint={getAPIServer() + 'persona/' + selectedPersona?.id + '/profile_image'} onEdited={onEdited} selected={selectedPersona}></UploadableProfileBox>
            </GridItem>
            <GridItem>
                <Text>페르소나 이름</Text>
                <AutoSubmitEditable
                    endpoint={selectedPersona !== null ? getAPIServer() + 'persona/' + selectedPersona.id : ''}
                    valueName={'name'} value={name} setValue={setName} onEdited={onEdited}></AutoSubmitEditable>
            </GridItem>
            <GridItem>
                <Text>페르소나 닉네임</Text>
                <AutoSubmitEditable
                    endpoint={selectedPersona !== null ? getAPIServer() + 'persona/' + selectedPersona.id : ''}
                    valueName={'displayName'} value={displayName} setValue={setDisplayName} onEdited={onEdited}></AutoSubmitEditable>
            </GridItem>
        </Grid>
    )
}