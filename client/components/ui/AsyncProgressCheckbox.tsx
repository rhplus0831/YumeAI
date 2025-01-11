"use client";

import {Checkbox, CheckboxProps, Popover, PopoverContent, PopoverTrigger} from "@nextui-org/react";
import {useState} from "react";

interface AsyncProgressCheckboxProps extends CheckboxProps {
    onValueChangeAsync: (value: boolean) => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressCheckbox(props: AsyncProgressCheckboxProps) {
    const {onValueChangeAsync, finallyCallback, ...restProps} = props;
    const [internalIsLoading, setInternalIsLoading] = useState(false)

    const [isOpen, setIsOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("")

    function internalOnValueChange(value: boolean) {
        async function async() {
            try {
                setIsOpen(false)
                setErrorMessage("")
                setInternalIsLoading(true)
                await onValueChangeAsync(value)
            } catch (e) {
                if (e instanceof Error) {
                    setIsOpen(true)
                    setErrorMessage(`${e.name}: ${e.message}`)
                }
            } finally {
                setInternalIsLoading(false)
                finallyCallback?.()
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
                <Checkbox {...restProps} disabled={internalIsLoading} onValueChange={internalOnValueChange}>
                    {props.children}
                </Checkbox>
            </div>
        </PopoverTrigger>
        <PopoverContent>
            <p>{errorMessage}</p>
        </PopoverContent>
    </Popover>)
}