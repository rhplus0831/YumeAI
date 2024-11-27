import React from "react";
import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
    VStack
} from "@chakra-ui/react";
import BaseList from "./BaseList";

export default function BaseSelectModal<dataType>({
                                                                  displayName,
                                                                  endpoint,
                                                                  createBox,
                                                                  open,
                                                                  onOpen,
                                                                  onClose
                                                              }: {
    displayName: string,
    endpoint: string,
    createBox: (data: dataType) => React.ReactElement,
    open: boolean,
    onOpen: () => void,
    onClose: () => void;
}) {
    const [items, setItems] = React.useState<dataType[]>([])
    const modalProps = useDisclosure({isOpen: open, onOpen: onOpen, onClose: onClose})

    return (
        <Modal {...modalProps}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>{displayName} 선택</ModalHeader>
                <ModalCloseButton/>
                <ModalBody pb={6}>
                    <BaseList display={true} displayName={displayName} endpoint={endpoint} createBox={createBox}
                              createForm={null} createItemJson={null} items={items} setItems={setItems}></BaseList>
                </ModalBody>
                <ModalFooter>
                    <VStack width={"auto"}>
                        <Button onClick={onClose}>취소</Button>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}