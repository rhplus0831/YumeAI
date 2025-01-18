"use client";

import {useState} from "react";
import {Button, ButtonGroup, CircularProgress} from "@nextui-org/react";
import {MdCheck, MdOutlineCancel} from "react-icons/md";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {Input} from "@nextui-org/input";

export default function SubmitSpan({value, label, placeholder, submit, hideOnIdle}: {
    value: string,
    label: string,
    placeholder?: string,
    submit: (value: string) => Promise<unknown>
    hideOnIdle?: boolean
}) {
    const [internalValue, setInternalValue] = useState("")
    const [inEdit, setInEdit] = useState(false)

    const [inSubmit, setInSubmit] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    async function submitInternal() {
        try {
            setInSubmit(true)
            setErrorMessage("")
            await submit(internalValue)
            setInEdit(false)
        } catch (e) {
            if (e instanceof Error) {
                setErrorMessage(`${e.name}: ${e.message}`)
            }
        } finally {
            setInSubmit(false)
        }
    }

    const editButtonGroup = <ButtonGroup size={"sm"}>
        <Button isIconOnly onPress={submitInternal}><MdCheck size={"20"}/></Button>
        <Button isIconOnly onPress={() => {
            setInEdit(false)
        }}><MdOutlineCancel size={"20"}/></Button>
    </ButtonGroup>

    function getPlaceholder() {
        if (placeholder) return placeholder;

        return "비어 있음..."
    }

    function startEditing() {
        setInternalValue(value)
        setInEdit(true)
    }
    
    function getDisplayValue() {
        if(!value) return getPlaceholder();

        if(hideOnIdle) {
            return "눌러서 확인하기"
        }

        return value
    }

    return (<ErrorPopover errorMessage={errorMessage}>
        {inEdit ?
            <div>
                {/*클릭했을때 바로 나오는 항목이기 때문에, 이 항목은 autoFocus를 쓰는게 유저 경험상 더 바람직함*/}
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <Input className={"w-full"} disabled={inSubmit} autoFocus size={"sm"} defaultValue={internalValue}
                       label={label}
                       onValueChange={(value) => {
                           setInternalValue(value)
                       }} endContent={inSubmit ? <CircularProgress/> : editButtonGroup}/>
            </div>
            :
            <button className={"w-full flex flex-col cursor-text text-left"} onClick={startEditing}
                    onTouchStart={startEditing}>
                <span className={"text-xs"}>{label}</span>
                <span className={value ? '' : 'text-gray-400 italic'}>{getDisplayValue()}</span>
            </button>
        }
    </ErrorPopover>)
}