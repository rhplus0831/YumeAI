import {Card, CardBody, Center, Flex, IconButton, Spacer, Stack, StackDivider, Text} from "@chakra-ui/react";
import {AddIcon} from "@chakra-ui/icons";
import SendingAlert from "../../Base/SendingAlert/SendingAlert";
import React, {ReactElement, ReactNode} from "react";
import {notifyFetch, useSendingAlert} from "../../Base/SendingAlert/useSendingAlert";
import {getAPIServer} from "../../Configure";
import BaseCreateModal from "./BaseCreateModal";

export default function BaseList<dataType>({
                                                           display,
                                                           displayName,
                                                           endpoint,
                                                           createBox,
                                                           createForm,
                                                           createItemJson,
                                                           items,
                                                           setItems
                                                       }: {
    display: boolean,
    displayName: string,
    endpoint: string,
    createBox: (item: dataType) => ReactElement,
    createForm: ((initialRef: React.MutableRefObject<null>) => ReactElement) | null,
    createItemJson: (() => string) | null,
    items: dataType[],
    setItems: React.Dispatch<React.SetStateAction<dataType[]>>,
    children?: ReactNode;
}) {

    let sending = false
    const sendingAlertProp = useSendingAlert()

    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        async function getItemList() {
            if (sending) {
                return
            }
            sending = true;
            try {
                const data = await notifyFetch(getAPIServer() + endpoint, sendingAlertProp, {
                    method: "GET"
                }, displayName + " 목록을 받아오고 있습니다...")
                setItems(data)
            } catch { /* empty */ }
            sending = false;
        }

        getItemList().then()
    }, [])

    const openCreateModal = () => {
        setOpen(true)
    }

    const closeCreateModal = () => {
        setOpen(false)
    }

    return (
        <>
            <Flex display={display ? 'flex' : 'none'} flexDirection="column" minHeight={'100%'} height={'auto'}
                  overflow={"scroll"}>
                <Flex flexDirection={"row"}>
                    <Center>
                        <Text>{displayName} 목록</Text>
                    </Center>
                    <Spacer></Spacer>
                    {
                        createForm !== null ?
                            <IconButton aria-label={displayName + " 만들기"} icon={<AddIcon/>}
                                        onClick={openCreateModal}></IconButton> : null
                    }
                </Flex>
                <SendingAlert {...sendingAlertProp}></SendingAlert>
                <Card variant={"unstyled"}>
                    <CardBody>
                        <Stack padding={'8px'} divider={<StackDivider/>} spacing='4'>
                            {items.map((item) => (
                                createBox(item)
                            ))}
                        </Stack>
                    </CardBody>
                </Card>
            </Flex>
            {
                createForm !== null ?
                    <BaseCreateModal items={items} setItems={setItems} open={open} onOpen={openCreateModal}
                                     onClose={closeCreateModal} displayName={displayName} endpoint={endpoint}
                                     createForm={createForm}
                                     createItemJson={createItemJson !== null ? createItemJson : (): string => {throw Error('createItemJson is null for ' + displayName)}}></BaseCreateModal>
                    : null
            }

        </>
    )
}