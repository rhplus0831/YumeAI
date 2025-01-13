import Prompt, {lintPrompt} from "@/lib/data/Prompt";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {useState} from "react";
import {MdCheck} from "react-icons/md";
import {Modal, ModalBody, ModalContent, ModalHeader, useDisclosure} from "@nextui-org/react";

export default function PromptLintButton({prompt, isDisabled}: { prompt: Prompt, isDisabled: boolean }) {
    const [isOK, setIsOK] = useState(false)
    const [messages, setMessages] = useState<string[]>([])
    const modalDisclosure = useDisclosure()

    return <>
        <Modal isOpen={modalDisclosure.isOpen} size={"xl"} onOpenChange={modalDisclosure.onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">문제 발견</ModalHeader>
                        <ModalBody>
                            <section className={"flex flex-col gap-1 max-h-[40rem] overflow-y-scroll"}>
                                {messages.map((message) => (<p key={message}>{message}</p>))}
                            </section>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
        {isDisabled && <span className={"text-xs"}>검토를 위해서는 먼저 저장해야 합니다.</span>}
        <AsyncProgressButton isDisabled={isDisabled} className={"w-full"} isIconOnly={isOK} onPressAsync={async () => {
            const lint = await lintPrompt(prompt.id)
            if (lint.check == "ok") {
                setIsOK(true)
                setTimeout(() => {
                    setIsOK(false)
                }, 5000)
            } else {
                setMessages(lint.message)
                modalDisclosure.onOpen()
            }
        }}>{isOK ? <MdCheck size={"28"}/> : '검토'}</AsyncProgressButton>
    </>
}