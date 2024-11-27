import {
    Button,
    HStack,
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
import React, {ReactElement} from "react";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import {getAPIServer} from "../../Configure";
import SendingAlert from "../../Base/SendingAlert/SendingAlert";

export default function BaseCreateModal<dataType>({
                                                      items,
                                                      setItems,
                                                      open,
                                                      onOpen,
                                                      onClose,
                                                      displayName,
                                                      endpoint,
                                                      createForm,
                                                      createItemJson
                                                  }: {
    items: dataType[],
    setItems: React.Dispatch<React.SetStateAction<dataType[]>>,
    open: boolean
    onOpen: () => void,
    onClose: () => void,
    displayName: string
    endpoint: string,
    createForm: (initialRef: React.MutableRefObject<null>) => ReactElement
    createItemJson: () => string;
}) {
    const modalProps = useDisclosure({isOpen: open, onOpen: onOpen, onClose: onClose})
    const initialRef = React.useRef(null)

    let sending = false
    const sendingAlertProp = useSendingAlert()

    const createItem = async () => {
        if (sending) {
            return;
        }
        sending = true;
        try {
            const item = await notifyFetch(getAPIServer() + endpoint, sendingAlertProp, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: createItemJson()
            }, displayName + " 만드는중...")
            setItems([...items, item])
            onClose()
        } catch { /* empty */
        }
        sending = false;
    }

    return (
        <Modal
            initialFocusRef={initialRef}
            {...modalProps}
        >
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>{displayName} 만들기</ModalHeader>
                <ModalCloseButton/>
                <ModalBody pb={6}>
                    {createForm(initialRef)}
                    <SendingAlert {...sendingAlertProp}></SendingAlert>
                </ModalBody>
                <ModalFooter>
                    <VStack width={"auto"}>
                        <HStack>
                            <Button onClick={createItem} colorScheme='blue' mr={3}>
                                만들기
                            </Button>
                            <Button onClick={onClose}>취소</Button>
                        </HStack>
                    </VStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}