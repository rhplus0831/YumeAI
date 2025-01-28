"use client";

import {Button, ButtonProps} from "@nextui-org/react";
import {useState} from "react";
import {MdDeleteForever} from "react-icons/md";
import ErrorPopover from "@/components/ui/ErrorPopover";

interface DeleteConfirmButtonProps extends ButtonProps {
    confirmCount: number;
    onConfirmed?: () => void;
    onConfirmedAsync?: () => Promise<void>;
}

export default function DeleteConfirmButton(props: DeleteConfirmButtonProps) {
    const {onConfirmed, onConfirmedAsync, confirmCount, onPress, ...restProps} = props;
    const [confirm, setConfirm] = useState<number>(0)
    const [timeoutHolder, setTimeoutHolder] = useState<number>(-1)

    const [loading, setLoading] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string>("")

    async function callConfirm() {
        setLoading(true)
        try {
            if (onConfirmed) {
                onConfirmed()
            } else if (onConfirmedAsync) {
                await onConfirmedAsync()
            } else {
                throw new Error("onConfirmed or onConfirmedAsync is required")
            }
        } catch (err) {
            console.log(err)
            if (err instanceof Error) {
                setErrorMessage(err.message)
            }
        } finally {
            setLoading(false)
            setConfirm(0)
        }
    }

    return (
        <ErrorPopover errorMessage={errorMessage}>
            <Button isLoading={loading} {...restProps} color={confirm ? "danger" : "default"}
                    startContent={<MdDeleteForever size={"20"}/>}
                    onPress={() => {
                        if (confirm + 1 < confirmCount) {
                            window.clearTimeout(timeoutHolder)
                            setConfirm(confirm + 1)
                            setTimeoutHolder(window.setTimeout(() => {
                                setConfirm(0)
                            }, 5000))
                            return
                        }
                        callConfirm().then()
                    }}>{confirm ? `확실한가요? (${confirmCount - confirm}번 남음)` : "삭제"}</Button>
        </ErrorPopover>
    )
}