import {useState} from "react";
import {
    Box,
    ButtonGroup,
    Center,
    CircularProgress,
    Editable,
    EditableInput,
    EditablePreview,
    Flex,
    IconButton,
    Input,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Spacer,
    useEditableControls
} from "@chakra-ui/react";
import {CheckIcon, CloseIcon, EditIcon, RepeatIcon} from "@chakra-ui/icons";

export default function AutoSubmitEditable<dataType>({endpoint, valueName, value, setValue, onEdited}: {
    endpoint: string,
    valueName: string,
    value: string,
    setValue: (value: string) => void,
    onEdited: (data: dataType) => void,
}) {
    function EditableControls() {
        const {
            isEditing,
            getSubmitButtonProps,
            getCancelButtonProps,
            getEditButtonProps,
        } = useEditableControls()

        return isEditing ? (
            <ButtonGroup marginLeft={'8px'} justifyContent='center' size='sm'>
                <IconButton aria-label={'Submit'} icon={<CheckIcon/>} {...getSubmitButtonProps()} />
                <IconButton aria-label={'Cancel'} icon={<CloseIcon/>} {...getCancelButtonProps()} />
            </ButtonGroup>
        ) : (
            <Center>
                <Box marginLeft={'8px'}>
                    <IconButton display={status === 'normal' ? 'block' : 'none'} aria-label={'Edit'} size='sm'
                                icon={<EditIcon/>} {...getEditButtonProps()} />
                    <CircularProgress display={status === 'progress' ? 'block' : 'none'} isIndeterminate
                                      size={'24px'}></CircularProgress>
                    <Popover isOpen={status === 'error'}>
                        <PopoverTrigger>
                            <IconButton display={status === 'error' ? 'block' : 'none'} aria-label={'Error Retry'}
                                        size={'sm'} icon={<RepeatIcon></RepeatIcon>}
                                        onClick={() => {
                                            update().then()
                                        }}></IconButton>
                        </PopoverTrigger>
                        <PopoverContent>
                            <PopoverArrow/>
                            <PopoverCloseButton/>
                            <PopoverHeader>에러 발생</PopoverHeader>
                            <PopoverBody>{errorMessage}</PopoverBody>
                        </PopoverContent>
                    </Popover>

                </Box>
            </Center>
        )
    }

    const [status, setStatus] = useState("normal");
    const [errorMessage, setErrorMessage] = useState("");

    let isProcessing = false;

    const update = async () => {
        if (isProcessing) {
            // TODO: Respect duplicated request
            return
        }
        isProcessing = true;
        setStatus('progress')

        const notifyError = (detail: string = "") => {
            setStatus('error')
            setErrorMessage(detail)
        }

        try {
            const jsonObj: { [valueName: string]: string } = { [valueName]: value }

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonObj)
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
            onEdited(data)
            setStatus('normal')
        } catch (err: unknown) {
            console.log(err)
            try {
                if(err instanceof Error) {
                    notifyError(err.message)
                }
            } catch { /* empty */ }
        }
        isProcessing = false;
    }

    return (
        <Editable isDisabled={!(status === 'normal' || status === 'error')} fontSize={'1xl'} value={value}
                  onChange={(nextValue: string) => setValue(nextValue)} onSubmit={() => {
            update().then()
        }}>
            <Flex>
                <EditablePreview/>
                <Input as={EditableInput}></Input>
                <Spacer></Spacer>
                <EditableControls></EditableControls>
            </Flex>
        </Editable>
    )
}