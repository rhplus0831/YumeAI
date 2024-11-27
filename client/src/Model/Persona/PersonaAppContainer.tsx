import PersonaList from "./PersonaList";
import * as React from "react";
import {Box, Grid, GridItem} from "@chakra-ui/react";
import Persona from "./Persona";
import PromptEditorBox from "../Base/PromptEditorBox";
import {getAPIServer} from "../../Configure";
import PersonaSidebar from "./PersonaSidebar";

export default function PersonaAppContainer() {
    const [selectedPersona, setSelectedPersona] = React.useState<Persona | null>(null);
    const [personas, setPersonas] = React.useState<Persona[]>([]);

    const changeSelectedPersona = (selectedPersona: Persona) => {
        const newPersonas = personas.map((item: Persona) => {
            if (item.id == selectedPersona.id) {
                return selectedPersona;
            } else {
                return item;
            }
        })

        setPersonas(newPersonas)
        setSelectedPersona(selectedPersona)
    }

    return (
        <Box height={'calc(100vh - 48px)'}
             maxHeight={'calc(100vh - 48px)'}>
            <Grid
                gridTemplateRows={'1fr'}
                gridTemplateColumns={'300px 1fr'} h={'inherit'} maxHeight={'inherit'} gap={4}
                paddingBottom="16px">
                <GridItem w='300px' h={'inherit'} maxH={'inherit'}>
                    <PersonaList personas={personas} setPersonas={setPersonas} selectedPersona={selectedPersona}
                                 setSelectedPersona={setSelectedPersona} selectButtonText={'수정하기'}></PersonaList>
                    <PersonaSidebar selectedPersona={selectedPersona} setSelectedPersona={setSelectedPersona} onEdited={(data: Persona) => {
                        changeSelectedPersona(data)
                    }}></PersonaSidebar>
                </GridItem>
                <GridItem w='100%' h={'inherit'} maxH={'inherit'}>
                    <PromptEditorBox item={selectedPersona} display={selectedPersona !== null}
                                     endpoint={selectedPersona !== null ? getAPIServer() + 'persona/' + selectedPersona.id : ''}
                                     onPromptSaved={(prompt: string) => {
                                         if (selectedPersona === null) return
                                         selectedPersona.prompt = prompt
                                         changeSelectedPersona(selectedPersona)
                                     }}></PromptEditorBox>
                </GridItem>
            </Grid>
        </Box>
    )
}