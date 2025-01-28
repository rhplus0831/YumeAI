"use client";

import {
    Button,
    ButtonProps,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure
} from "@nextui-org/react";
import {Input} from "@nextui-org/input";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {useState} from "react";
import {useRouter} from "next/navigation";

export interface CreateWithNameButtonProps extends ButtonProps {
    dataName: string,
    createSelf: (name: string) => Promise<unknown>
}

export default function CreateWithNameButton(props: CreateWithNameButtonProps) {
    const {dataName, createSelf, ...buttonProps} = props

    const disclosure = useDisclosure()
    const [name, setName] = useState("")
    const [nameInvalid, setNameInvalid] = useState(false)

    const router = useRouter()

    return (<>
        <Button {...buttonProps} onPress={disclosure.onOpen}>
            {dataName} 만들기
        </Button>
        <Modal isOpen={disclosure.isOpen} onOpenChange={disclosure.onOpenChange}>
            <ModalContent>
                {(onClose) => (<>
                    <ModalHeader>{dataName} 만들기</ModalHeader>
                    <ModalBody>
                        <Input isInvalid={nameInvalid} errorMessage={"이름을 입력해주세요"} label={`${dataName} 이름`} value={name}
                               onChange={(event) => {
                                   setName(event.target.value)
                                   setNameInvalid(false)
                               }}/>
                    </ModalBody>
                    <ModalFooter>
                        <Button color={"default"} onPress={onClose}>닫기</Button>
                        <AsyncProgressButton onPressAsync={async () => {
                            setNameInvalid(false)
                            if (!name) {
                                setNameInvalid(true)
                                return
                            }
                            await createSelf(name)
                            onClose()
                            router.refresh()
                        }} color={"primary"}>만들기</AsyncProgressButton>
                    </ModalFooter>
                </>)}
            </ModalContent>
        </Modal>
    </>)
}