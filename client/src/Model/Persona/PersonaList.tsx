import {FormControl, FormLabel, Input} from "@chakra-ui/react";
import React from "react";
import PersonaBox from "./PersonaBox";
import BaseList from "../Base/BaseList";
import Persona from "./Persona";

export default function PersonaList({selectedPersona, setSelectedPersona, personas, setPersonas, selectButtonText}: {
    selectedPersona: Persona | null,
    setSelectedPersona: (persona: Persona | null) => void,
    personas: Persona[],
    setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>,
    selectButtonText: string
}) {
    const [name, setName] = React.useState("");
    const [displayName, setDisplayName] = React.useState("");

    return (
        <BaseList<Persona> display={selectedPersona === null} items={personas} setItems={setPersonas} displayName={'페르소나'}
                           endpoint={'persona/'} createBox={(persona) => (
            <PersonaBox persona={persona} setSelectedPersona={setSelectedPersona} key={persona.id} selectButtonText={selectButtonText}></PersonaBox>)}
                           createForm={(initialRef) => (
                               <FormControl>
                                   <FormLabel>페르소나 이름</FormLabel>
                                   <Input ref={initialRef} value={name} onChange={(event) => {
                                       setName(event.target.value)
                                   }} placeholder='페르소나 이름'/>
                                   <FormLabel>페르소나 닉네임</FormLabel>
                                   <Input value={displayName} onChange={(event) => {
                                       setDisplayName(event.target.value)
                                   }} placeholder='페르소나 닉네임'/>
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