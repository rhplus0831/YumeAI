"use client";

import {Checkbox, CheckboxProps} from "@nextui-org/react";
import {useState} from "react";
import ErrorPopover from "@/components/ui/ErrorPopover";

interface AsyncProgressCheckboxProps extends CheckboxProps {
    onValueChangeAsync: (value: boolean) => Promise<void>
    finallyCallback?: () => void | undefined
}

export default function AsyncProgressCheckbox(props: AsyncProgressCheckboxProps) {
    const {onValueChangeAsync, finallyCallback, ...restProps} = props;
    const [internalIsLoading, setInternalIsLoading] = useState(false)

    const [errorMessage, setErrorMessage] = useState("")

    function internalOnValueChange(value: boolean) {
        async function async() {
            try {
                setErrorMessage("")
                setInternalIsLoading(true)
                await onValueChangeAsync(value)
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

    return (
        <ErrorPopover errorMessage={errorMessage}>
            <div>
                <Checkbox {...restProps} disabled={internalIsLoading} onValueChange={internalOnValueChange}>
                    {props.children}
                </Checkbox>
            </div>
        </ErrorPopover>)
}