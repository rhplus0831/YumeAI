"use client";

import {Button, ButtonProps, Popover, PopoverContent, PopoverTrigger} from "@nextui-org/react";
import {useState} from "react";

interface AsyncProgressButtonProps extends ButtonProps {
    onPressAsync: () => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressButton(props: AsyncProgressButtonProps) {
    const {isLoading, ...restProps} = props;

    const [internalIsLoading, setInternalIsLoading] = useState(false)

    const [isOpen, setIsOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("")

    function internalOnPress() {
        async function async() {
            try {
                setIsOpen(false)
                setErrorMessage("")
                setInternalIsLoading(true)
                await props.onPressAsync()
            } catch (e) {
                if (e instanceof Error) {
                    setIsOpen(true)
                    setErrorMessage(`${e.name}: ${e.message}`)
                }
            } finally {
                setInternalIsLoading(false)
                props.finallyCallback?.()
            }
        }

        async().then()
    }

    return (<Popover shouldBlockScroll={false} shouldCloseOnScroll={true} shouldCloseOnBlur={true} showArrow size={"lg"}
                     color={"danger"} isOpen={isOpen} onOpenChange={(open) => {
        if (!open) {
            setIsOpen(false)
        }
    }} shouldCloseOnInteractOutside={() => true}>
        <PopoverTrigger>
            <div>
                <Button {...restProps} isLoading={internalIsLoading} onPress={internalOnPress}>
                    {restProps.children}
                </Button>
            </div>
        </PopoverTrigger>
        <PopoverContent>
            <p>{errorMessage}</p>
        </PopoverContent>
    </Popover>)
}