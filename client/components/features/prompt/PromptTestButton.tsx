import Prompt, {testPrompt} from "@/lib/data/Prompt";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {useState} from "react";
import {Modal, ModalBody, ModalContent, ModalHeader, useDisclosure} from "@nextui-org/react";

export default function PromptTestButton({prompt, isDisabled}: { prompt: Prompt, isDisabled: boolean }) {
    const [result, setResult] = useState<string>("")
    const modalDisclosure = useDisclosure()

    return <>
        <Modal isOpen={modalDisclosure.isOpen} size={"full"} onOpenChange={modalDisclosure.onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">예시 출력</ModalHeader>
                        <ModalBody className={"max-h-full"}>
                            <section
                                className={"flex flex-col gap-1 overflow-y-scroll whitespace-pre-wrap"}>
                                {result}
                            </section>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
        {isDisabled && <span className={"text-xs"}>테스트를 위해서는 먼저 저장해야 합니다.</span>}
        <AsyncProgressButton isDisabled={isDisabled} className={"w-full"} onPressAsync={async () => {
            const test = await testPrompt(prompt.id)
            setResult(test.message)
            modalDisclosure.onOpen()
        }}>테스트</AsyncProgressButton>
    </>
}