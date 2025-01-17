import BaseSelectModal from "@/components/ui/base/BaseSelectModal";
import {Button, useDisclosure} from "@nextui-org/react";
import {useEffect, useState} from "react";
import FirstMessage from "@/lib/data/bot/FirstMessage";
import FirstMessageBox from "@/components/features/bot/firstMessage/FirstMessageBox";

export default function FirstMessageSelectButtonWithModal({rawFirstMessage, applyFirstMessage}: {
    rawFirstMessage: string | undefined,
    applyFirstMessage: (firstMessage: FirstMessage) => Promise<void>
}) {
    const [firstMessages, setFirstMessages] = useState<FirstMessage[]>([])

    useEffect(() => {
        try {
            if(!rawFirstMessage) return setFirstMessages([])
            setFirstMessages(JSON.parse(rawFirstMessage))
        } catch {
            setFirstMessages([])
        }
    }, [rawFirstMessage])

    const disclosure = useDisclosure()
    return <>
        <Button isDisabled={rawFirstMessage?.length === 0} onPress={disclosure.onOpen}>첫 메시지 적용하기</Button>
        <BaseSelectModal disclosure={disclosure} displayName={'첫 메시지'}
                         generateBox={(firstMessage) => (<FirstMessageBox firstMessage={firstMessage}/>)}
                         datas={firstMessages} onSelect={async (firstMessage) => {
            await applyFirstMessage(firstMessage)
            disclosure.onClose()
        }}/>
    </>
}