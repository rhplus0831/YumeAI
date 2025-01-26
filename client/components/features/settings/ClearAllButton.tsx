import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@nextui-org/react";
import DeleteConfirmButton from "@/components/ui/DeleteConfirmButton";
import {api} from "@/lib/api-client";
import {useState} from "react";

export default function ClearAllButton() {
    const {isOpen, onOpen, onOpenChange} = useDisclosure()
    const [isInClearing, setIsInClearing] = useState(false)

    async function clearAll() {
        try {
            await api('clear-all', {
                method: 'POST'
            })
            window.location.replace("/")
        } catch (err) {
            console.error(err)
        }
    }

    return <>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">모든 데이터 지우기</ModalHeader>
                        <ModalBody>
                            <p>
                                현재 이 계정에 있는 모든 데이터를 삭제하려고 하고있습니다.<br/>
                                이 동작은 <span>되돌릴 수 없습니다</span>, 계속하시겠습니까?<br/>
                                작업이 성공적으로 완료된경우 메인으로 이동합니다
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" variant="solid" onPress={onClose}>
                                안하겠소
                            </Button>
                            <DeleteConfirmButton isLoading={isInClearing} confirmCount={5} onConfirmed={() => {
                                setIsInClearing(true)
                                clearAll().then()
                            }}/>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
        <Button onPress={onOpen}>모든 데이터 지우기</Button>
    </>
}