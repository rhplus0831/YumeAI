"use client";

import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import {UseDisclosureReturn} from "@nextui-org/use-disclosure";
import Room, {suggestMessage} from "@/lib/data/Room";
import {Textarea} from "@nextui-org/input";
import AsyncProgressButton from "@/components/ui/AsyncProgressButton";
import {useState} from "react";
import SuggestedInputBox from "@/components/features/room/conversation/SuggestedInputBox";

export interface InputSuggestModalProps extends UseDisclosureReturn {
    room: Room,
    setUserMessage: (message: string) => void,
}

export default function InputSuggestModal(props: InputSuggestModalProps) {
    const {room, isOpen, onClose, onOpenChange} = props;
    const [inputs, setInputs] = useState<Record<string, string>>({})

    const [responses, setResponses] = useState<string[]>([])

    async function getSuggestedInput() {
        if (room.suggest_prompt?.toggles) {
            const toggles = room.suggest_prompt.toggles.split("\n")
            for (const toggle of toggles) {
                const [name, display] = toggle.split("=")
                if (!inputs[name]) {
                    throw new Error(`${name}이 설정되지 않습니다.`)
                }
            }
        }

        const response = await suggestMessage(room.id, inputs)
        setResponses(response.split("---").map((r) => r.trim()))
    }

    function onSuggestAccept(text: string) {
        props.setUserMessage(text)
        setResponses([])
        setInputs({})
        onClose()
    }

    function getModalBody() {
        if (responses.length !== 0) {
            return responses.map((response) => <SuggestedInputBox onSuggestAccept={onSuggestAccept} room={room}
                                                                  key={response} text={response}/>)
        }

        if (room.suggest_prompt?.toggles) {
            return room.suggest_prompt.toggles.split("\n").map((toggle) => {
                const [name, display] = toggle.split("=")

                return <Textarea minRows={1} key={name} label={display} value={inputs[name]} onValueChange={(value) => {
                    const newInputs = {...inputs}
                    newInputs[name] = value
                    setInputs(newInputs)
                }}/>
            })
        }
        return undefined
    }

    return (<Modal isOpen={isOpen} isDismissable={true} placement={"center"} scrollBehavior={"outside"}
                   onOpenChange={onOpenChange}>
        <ModalContent>
            {(onClose) => (
                <>
                    <ModalHeader className="flex flex-col gap-1">입력 추천</ModalHeader>
                    <ModalBody className={"flex flex-col gap-4"}>
                        {getModalBody()}
                    </ModalBody>
                    <ModalFooter>
                        {responses.length !== 0 && <Button color="danger" variant="light" onPress={() => {
                            setResponses([])
                        }}>
                            추천 초기화 하기
                        </Button>}
                        <AsyncProgressButton
                            onPressAsync={getSuggestedInput}>{responses.length !== 0 ? '리롤하기' : '추천받기'}</AsyncProgressButton>
                    </ModalFooter>
                </>
            )}
        </ModalContent>
    </Modal>)
}