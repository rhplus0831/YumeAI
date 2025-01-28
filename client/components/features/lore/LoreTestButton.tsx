import {OpenedLoreBook, testLoreBook} from "@/lib/data/lore/ReadLoreBook";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import {useState} from "react";
import {Textarea} from "@nextui-org/input";

export default function LoreTestButton({book}: { book: OpenedLoreBook }) {
    const {isOpen, onOpen, onOpenChange} = useDisclosure()
    const [result, setResult] = useState<string | undefined>(undefined)
    const [testStr, setTestStr] = useState<string>("")

    async function getTestResult() {
        setResult(await testLoreBook(book, testStr))
    }

    return <>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">로어북 테스트</ModalHeader>
                        <ModalBody className={"flex flex-col gap-4"}>
                            <span className={"text-xs"}>
                                결과
                            </span>
                            <span className={"whitespace-pre-line"}>{result}</span>
                            <Textarea value={testStr} onValueChange={setTestStr} label={"트리거 워드"}/>
                        </ModalBody>
                        <ModalFooter>
                            <AsyncProgressButton
                                onPressAsync={getTestResult}>테스트</AsyncProgressButton>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        <Button onPress={onOpen}>테스트</Button>
    </>
}