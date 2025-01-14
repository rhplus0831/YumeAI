import Prompt, {testPrompt} from "@/lib/data/Prompt";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import PromptToggleSelect from "@/components/features/prompt/toggle/PromptToggleSelect";

export default function PromptTestButton({prompt, isDisabled}: { prompt: Prompt, isDisabled: boolean }) {
    const [result, setResult] = useState<string>("")
    const modalDisclosure = useDisclosure()
    const [checkedToggle, setCheckedToggle] = useState("")

    return <>
        <Modal isOpen={modalDisclosure.isOpen} size={"full"} onOpenChange={modalDisclosure.onOpenChange}>
            <ModalContent className={"flex flex-col"}>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex-0 flex flex-col gap-1">예시 출력</ModalHeader>
                        <ModalBody className={"flex-1 overflow-y-scroll"}>
                            <section
                                className={"flex flex-col gap-1 overflow-y-scroll whitespace-pre-wrap"}>
                                {result}
                            </section>
                        </ModalBody>
                        <ModalFooter className={"flex-0"}>
                            <Button onPress={onClose}>닫기</Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        {isDisabled && <span className={"text-xs"}>테스트를 위해서는 먼저 저장해야 합니다.</span>}
        <AsyncProgressButton isDisabled={isDisabled} className={"w-full"} onPressAsync={async () => {
            const test = await testPrompt(prompt.id, checkedToggle)
            setResult(test.message)
            modalDisclosure.onOpen()
        }}>테스트</AsyncProgressButton>
        {prompt.type === 'chat' && <PromptToggleSelect prompt={prompt} setCheckedToggles={setCheckedToggle} />}
    </>
}