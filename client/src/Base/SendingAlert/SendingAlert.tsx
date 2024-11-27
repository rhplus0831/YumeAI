import {Alert, AlertDescription, AlertIcon, AlertTitle, Box, CloseButton, Spacer} from "@chakra-ui/react";

//전달 상태를 보여주는 컴포넌트 입니다
export default function SendingAlert({display, alertTitle, alertStatus, alertDescription, onClose}: {
    display: boolean,
    alertTitle: string,
    alertStatus: "info" | "warning" | "success" | "error" | "loading" | undefined,
    alertDescription: string,
    onClose(): void
}) {
    return (
        <Alert display={display ? "flex" : "none"} marginTop="16px" minHeight="72px"
               status={alertStatus}>
            <AlertIcon/>
            <Box>
                <AlertTitle>{alertTitle}</AlertTitle>
                <AlertDescription>{alertDescription}</AlertDescription>
            </Box>
            <Spacer></Spacer>
            <CloseButton
                alignSelf='flex-start'
                onClick={onClose}
            />
        </Alert>
    )
}