"use client";

import {Button, ButtonProps} from "@nextui-org/react";
import {useState} from "react";
import ErrorPopover from "@/components/ui/ErrorPopover";

interface AsyncProgressButtonProps extends ButtonProps {
    onPressAsync: () => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressButton(props: AsyncProgressButtonProps) {
    const {isLoading, onPressAsync, finallyCallback, ...restProps} = props;

    const [internalIsLoading, setInternalIsLoading] = useState(false)

    const [errorMessage, setErrorMessage] = useState("")

    function internalOnPress() {
        async function async() {
            try {
                setErrorMessage("")
                setInternalIsLoading(true)
                await onPressAsync()
            } catch (e) {
                if (e instanceof Error) {
                    setErrorMessage(`${e.name}: ${e.message}`)
                }
            } finally {
                setInternalIsLoading(false)
                finallyCallback?.()
            }
        }

        async().then()
    }

    return (<ErrorPopover errorMessage={errorMessage}>
        <div>
            <Button {...restProps} isLoading={internalIsLoading} onPress={internalOnPress}>
                {restProps.children}
            </Button>
        </div>
    </ErrorPopover>)
}