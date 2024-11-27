import BaseSelectModal from "../Base/BaseSelectModal";
import React from "react";
import SendingAlert from "../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import {Button} from "@chakra-ui/react";
import PromptBox from "./PromptBox.tsx";
import Prompt from "./Prompt.ts";

export default function PromptSelectBox({prompt, onSelected}: {
    prompt: Prompt | null,
    onSelected: (prompt: Prompt, fetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<Prompt>) => Promise<void>,
}) {
    const sendingAlertProp = useSendingAlert()
    const [open, setOpen] = React.useState(false);

    const fetch = async (url: string, extra: RequestInit, progressMessage: string) => {
        return await notifyFetch(url, sendingAlertProp, extra, progressMessage, false);
    }

    return (
        <>
            {prompt !== null ? <PromptBox prompt={prompt} setSelectedPrompt={() => {
                setOpen(true)
            }} selectButtonText={'변경'}></PromptBox> : <Button onClick={() => {
                setOpen(true)
            }}>프롬프트 선택</Button>}
            <BaseSelectModal displayName={"프롬프트"} endpoint={"prompt/"} createBox={(prompt: Prompt) => (
                <PromptBox prompt={prompt} setSelectedPrompt={(prompt: Prompt | null) => {
                    if (prompt === null) return
                    setOpen(false)
                    onSelected(prompt, fetch).then()
                }} selectButtonText={'선택'}></PromptBox>)
            } open={open} onOpen={() => {
                setOpen(true)
            }} onClose={() => {
                setOpen(false)
            }}></BaseSelectModal>
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </>
    )
}