"use client";

import {Popover, PopoverContent, PopoverTrigger, Select, SelectProps} from "@nextui-org/react";
import {ChangeEvent, useState} from "react";

interface AsyncProgressCheckboxProps extends SelectProps {
    onValueChangeAsync: (value: string) => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressSelect(props: AsyncProgressCheckboxProps) {
    const {onValueChangeAsync, finallyCallback, ...restProps} = props;
    const [internalIsLoading, setInternalIsLoading] = useState(false)

    const [isOpen, setIsOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("")

    function internalOnChange(event: ChangeEvent<HTMLSelectElement>) {
        async function async() {
            try {
                setIsOpen(false)
                setErrorMessage("")
                setInternalIsLoading(true)
                await props.onValueChangeAsync(event.target.value)
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
                <Select {...restProps} disabled={internalIsLoading} onChange={internalOnChange}>
                    {props.children}
                </Select>
            </div>
        </PopoverTrigger>
        <PopoverContent>
            <p>{errorMessage}</p>
        </PopoverContent>
    </Popover>)
}