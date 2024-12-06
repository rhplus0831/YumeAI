import {useEffect, useRef, useState} from "react";
import {
    Box,
    Button,
    Center,
    CircularProgress,
    Flex,
    Grid,
    GridItem,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Spacer,
    Text,
    Textarea,
    useDisclosure
} from "@chakra-ui/react";
import {CheckIcon, EditIcon, WarningIcon} from "@chakra-ui/icons";

interface Prompt {
    prompt: string
}

export default function PromptEditorBox({item, display, endpoint, onPromptSaved, customData = undefined, getCustomResult = undefined, customTitle = undefined}: {
    item: Prompt | null,
    display: boolean,
    endpoint: string,
    onPromptSaved: (prompt: string) => void,
    customData?: (prompt: string) => unknown,
    getCustomResult?: (data: unknown) => string,
    customTitle?: string
}) {

    const [prompt, setPrompt] = useState('');
    const promptRef = useRef(prompt); //타임아웃의 상태가 저장되는 문제점 해결 용
    const [status, setStatus] = useState("normal");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        promptRef.current = prompt;
    }, [prompt]);

    const statusDisplay = (status: string) => {
        if (status === "normal") {
            return '최신 상태'
        } else if (status == "progress") {
            return '저장중'
        } else if (status == 'error') {
            return '문제 발생: ' + errorMessage
        } else if (status == 'edited') {
            return '수정됨'
        } else {
            return '?'
        }
    }

    const [promptAutoSaveTimeout, setPromptAutoSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [promptReminderTimeout, setPromptReminderTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

    const saveReminderProps = useDisclosure()

    const onPromptEdited = () => {
        setStatus('edited')
        if (promptReminderTimeout == null) {
            setPromptReminderTimeout(setTimeout(() => {
                saveReminderProps.onOpen()
            }, 60 * 1000))
        }
        if (promptAutoSaveTimeout != null) {
            console.log("Clear: " + promptAutoSaveTimeout)
            clearTimeout(promptAutoSaveTimeout)
        }
        setPromptAutoSaveTimeout(setTimeout(() => {
            save().then()
        }, 15 * 1000))
        console.log(promptAutoSaveTimeout)
    }

    let isProcessing = false;

    const save = async () => {
        if (isProcessing) {
            // TODO: Respect duplicated request
            return
        }
        if (promptReminderTimeout !== null) {
            clearTimeout(promptReminderTimeout)
            setPromptReminderTimeout(null)
        }
        if (promptAutoSaveTimeout !== null) {
            clearTimeout(promptAutoSaveTimeout)
            setPromptAutoSaveTimeout(null)
        }
        isProcessing = true;
        setStatus('progress')

        const notifyError = (detail: string = "") => {
            setStatus('error')
            setErrorMessage(detail)
        }

        try {
            const response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(customData ? customData(promptRef.current) : {
                    'prompt': promptRef.current
                })
            })
            const data = await response.json();
            if (!response.ok) {
                if (typeof (data.detail) !== "string") {
                    notifyError(data.detail[0].msg)
                } else {
                    notifyError(data.detail)
                }
                return
            }
            setPrompt(getCustomResult ? getCustomResult(data) : data.prompt)
            setStatus('normal')
            onPromptSaved(prompt)
        } catch (err: unknown) {
            console.log(err)
            try {
                if (err instanceof Error)
                    notifyError(err.message)
            } catch { /* empty */
            }
        }
        isProcessing = false;
    }

    useEffect(() => {
        if (item === null) return
        setPrompt(getCustomResult ? getCustomResult(item) : item.prompt)
    }, [item])

    const statusBarSize = '32px'
    const statusBarContentSize = '24px'
    const statusBarBottomPadding = '8px'

    return (
        <Grid display={display ? 'grid' : 'none'} templateRows={'1fr ' + statusBarSize}
              minHeight={'100%'}
              maxHeight={'100%'}>
            <GridItem>
                <Text>{customTitle ? customTitle : "프롬프트"}</Text>
                <Textarea value={prompt} onChange={(event) => {
                    setPrompt(event.target.value)
                    onPromptEdited()
                }} isDisabled={!(status === 'normal' || status === 'edited')}
                          height={'calc(100% - ' + statusBarSize + ')'}
                          resize={'none'}></Textarea>
            </GridItem>
            <GridItem>
                <Flex alignSelf={'flex-end'} minHeight={statusBarSize} paddingBottom={statusBarBottomPadding}>
                    <Box width={statusBarContentSize} height={statusBarContentSize} marginRight={'8px'}>
                        <CheckIcon boxSize={statusBarContentSize} color={'green.400'}
                                   display={status === 'normal' ? 'block' : 'none'}></CheckIcon>
                        <CircularProgress size={statusBarContentSize} isIndeterminate
                                          display={status === 'progress' ? 'block' : 'none'}></CircularProgress>
                        <EditIcon boxSize={statusBarContentSize} color={'yellow.300'}
                                  display={status === 'edited' ? 'block' : 'none'}></EditIcon>
                        <WarningIcon boxSize={statusBarContentSize} color={'red.400'}
                                     display={status === 'error' ? 'block' : 'none'}></WarningIcon>
                    </Box>
                    {statusDisplay(status)}
                    <Spacer></Spacer>
                    <Center>
                        <Popover autoFocus={false} isOpen={saveReminderProps.isOpen}
                                 onClose={saveReminderProps.onClose}>
                            <PopoverTrigger>
                                <Button disabled={!(status === 'normal' || status === 'edited' || status == 'error')}
                                        onClick={() => {
                                            save().then()
                                        }} size={'xs'} variant={'ghost'}>저장</Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <PopoverArrow/>
                                <PopoverHeader>알림</PopoverHeader>
                                <PopoverCloseButton/>
                                <PopoverBody>
                                    저장한지 오래되었습니다, 저장을 한번 하는건 어떨까요?
                                </PopoverBody>
                            </PopoverContent>
                        </Popover>
                    </Center>
                </Flex>
            </GridItem>
        </Grid>

    )
}