import BaseSelectModal from "../Base/BaseSelectModal";
import Persona from "../Persona/Persona";
import PersonaBox from "../Persona/PersonaBox";
import React from "react";
import SendingAlert from "../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import {Button} from "@chakra-ui/react";

export default function PersonaSelectBox({persona, onSelected}: {
    persona: Persona | null,
    onSelected: (persona: Persona, fetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<Persona>) => Promise<void>,
}) {
    const sendingAlertProp = useSendingAlert()
    const [open, setOpen] = React.useState(false);

    const fetch = async (url: string, extra: RequestInit, progressMessage: string) => {
        return await notifyFetch(url, sendingAlertProp, extra, progressMessage, false);
    }

    return (
        <>
            {persona !== null ? <PersonaBox persona={persona} setSelectedPersona={() => {setOpen(true)}} selectButtonText={'변경'}></PersonaBox> : <Button onClick={() => {setOpen(true)}}>페르소나 선택</Button>}
            <BaseSelectModal displayName={"페르소나"} endpoint={"persona/"} createBox={(persona: Persona) => (
                <PersonaBox persona={persona} setSelectedPersona={(persona: Persona | null) => {
                    if (persona === null) return
                    setOpen(false)
                    onSelected(persona, fetch).then()
                }} selectButtonText={'선택'}></PersonaBox>)
            } open={open} onOpen={() => {
                setOpen(true)
            }} onClose={() => {
                setOpen(false)
            }}></BaseSelectModal>
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </>
    )
}