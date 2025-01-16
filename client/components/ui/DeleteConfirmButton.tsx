"use client";

import {Button, ButtonProps} from "@nextui-org/react";
import {useState} from "react";
import {MdDeleteForever} from "react-icons/md";

interface DeleteConfirmButtonProps extends ButtonProps {
    confirmCount: number;
    onConfirmed?: () => void;
}

export default function DeleteConfirmButton(props: DeleteConfirmButtonProps) {
    const {onConfirmed, confirmCount, onPress, ...restProps} = props;
    const [confirm, setConfirm] = useState<number>(0)
    const [timeoutHolder, setTimeoutHolder] = useState<number>(-1)

    return (
        <Button {...restProps} color={confirm ? "danger" : "default"} startContent={<MdDeleteForever size={"20"}/>}
                onPress={() => {
                    if (confirm + 1 < confirmCount) {
                        window.clearTimeout(timeoutHolder)
                        setConfirm(confirm + 1)
                        setTimeoutHolder(window.setTimeout(() => {
                            setConfirm(0)
                        }, 5000))
                        return
                    }
                    onConfirmed?.()
                    setConfirm(0)
                }}>{confirm ? `확실한가요? (${confirmCount - confirm}번 남음)` : "삭제"}</Button>
    )
}