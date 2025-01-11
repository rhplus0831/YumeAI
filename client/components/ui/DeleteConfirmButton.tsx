"use client";

import {Button, ButtonProps} from "@nextui-org/react";
import {useState} from "react";
import {MdDeleteForever} from "react-icons/md";

interface DeleteConfirmButtonProps extends ButtonProps {
    onConfirmed?: () => void;
}

export default function DeleteConfirmButton(props: DeleteConfirmButtonProps) {
    const {onConfirmed, onPress, ...restProps} = props;
    let [confirm, setConfirm] = useState<boolean>(false)

    return (
        <Button {...restProps} color={confirm ? "danger" : "default"} startContent={<MdDeleteForever size={"20"}/>}
                onPress={() => {
                    if (!confirm) {
                        setConfirm(true)
                        setTimeout(() => {
                            setConfirm(false)
                        }, 5000)
                        return
                    }
                    onConfirmed?.()
                }}>{confirm ? "확실한가요?" : "삭제"}</Button>
    )
}