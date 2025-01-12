"use client";

import {Select, SelectProps} from "@nextui-org/react";
import {ChangeEvent, useState} from "react";
import ErrorPopover from "@/components/ui/ErrorPopover";

interface AsyncProgressCheckboxProps extends SelectProps {
    onValueChangeAsync: (value: string) => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressSelect(props: AsyncProgressCheckboxProps) {
    const {onValueChangeAsync, finallyCallback, ...restProps} = props;
    const [internalIsLoading, setInternalIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    function internalOnChange(event: ChangeEvent<HTMLSelectElement>) {
        async function async() {
            try {
                setErrorMessage("")
                setInternalIsLoading(true)
                await props.onValueChangeAsync(event.target.value)
            } catch (e) {
                if (e instanceof Error) {
                    setErrorMessage(`${e.name}: ${e.message}`)
                }
            } finally {
                setInternalIsLoading(false)
                props.finallyCallback?.()
            }
        }

        async().then()
    }

    return (<ErrorPopover errorMessage={errorMessage}>
        <div>
            <Select {...restProps} disabled={internalIsLoading} onChange={internalOnChange}>
                {props.children}
            </Select>
        </div>
    </ErrorPopover>)
}