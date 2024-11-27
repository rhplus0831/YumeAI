import BaseSelectModal from "../Base/BaseSelectModal";
import Bot from "../Bot/Bot";
import BotBox from "../Bot/BotBox";
import React from "react";
import SendingAlert from "../../Base/SendingAlert/SendingAlert";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import {Button} from "@chakra-ui/react";

export default function BotSelectBox({bot, onSelected}: {
    bot: Bot | null,
    onSelected: (bot: Bot, fetch: (url: string, extra: RequestInit, progressMessage: string) => Promise<Bot>) => Promise<void>,
}) {
    const sendingAlertProp = useSendingAlert()
    const [open, setOpen] = React.useState(false);

    const fetch = async (url: string, extra: RequestInit, progressMessage: string) => {
        return await notifyFetch(url, sendingAlertProp, extra, progressMessage, false);
    }

    return (
        <>
            {bot !== null ? <BotBox bot={bot} setSelectedBot={() => {setOpen(true)}} selectButtonText={'변경'}></BotBox> : <Button onClick={() => {setOpen(true)}}>봇 선택</Button>}
            <BaseSelectModal displayName={"봇"} endpoint={"bot/"} createBox={(bot: Bot) => (
                <BotBox bot={bot} setSelectedBot={(bot: Bot | null) => {
                    if (bot === null) return
                    setOpen(false)
                    onSelected(bot, fetch).then()
                }} selectButtonText={'선택'}></BotBox>)
            } open={open} onOpen={() => {
                setOpen(true)
            }} onClose={() => {
                setOpen(false)
            }}></BaseSelectModal>
            <SendingAlert {...sendingAlertProp}></SendingAlert>
        </>
    )
}