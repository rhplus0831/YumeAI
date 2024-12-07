import {Button, ButtonProps} from "@chakra-ui/react";
import {DeleteIcon} from "@chakra-ui/icons";
import {useState} from "react";

interface CustomButtonProps extends ButtonProps {
    onConfirmed?: () => void;
}

export default function DeleteConfirmButton({onConfirmed, ...buttonProps}: CustomButtonProps) {
    let [confirm, setConfirm] = useState<boolean>(false)

    return (<Button {...buttonProps} _hover={{bg: "red.500"}}
                    aria-label={"삭제"}
                    leftIcon={<DeleteIcon/>} onClick={() => {
        if (!confirm) {
            setConfirm(true)
            setTimeout(() => {
                setConfirm(false)
            }, 5000)
            return
        }
        onConfirmed?.()
    }}>{confirm ? "확실한가요?" : "삭제"}</Button>)
}