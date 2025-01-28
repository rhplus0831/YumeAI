"use client";

import {ReactNode, useState} from "react";
import {Autocomplete, Button, ButtonGroup, CircularProgress} from "@nextui-org/react";
import {MdCheck, MdOutlineCancel} from "react-icons/md";
import ErrorPopover from "@/components/ui/ErrorPopover";
import {Input, Textarea} from "@nextui-org/input";


export interface SubmitSpanProps {
    value: string,
    label: string,
    placeholder?: string,
    submit: (value: string) => Promise<unknown>
    hideOnIdle?: boolean
    description?: ReactNode
    inputType?: 'text' | 'search' | 'url' | 'tel' | 'email' | 'password' | (string & {})
    enforceNumber?: boolean
    enforceInteger?: boolean
    enforceNumberRange?: [number, number]
    autoComplete?: ReactNode,
    useTextarea?: boolean
    adaptiveDescriptionDisplay?: boolean
}

export default function SubmitSpan(props: SubmitSpanProps) {
    const {
        value,
        label,
        placeholder,
        submit,
        hideOnIdle,
        description,
        inputType,
        enforceNumber,
        enforceInteger,
        enforceNumberRange,
        autoComplete,
        useTextarea,
        adaptiveDescriptionDisplay
    } = props;

    const [internalValue, setInternalValue] = useState("")
    const [inEdit, setInEdit] = useState(false)

    const [inSubmit, setInSubmit] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    async function submitInternal() {
        try {
            setInSubmit(true)
            setErrorMessage("")

            if (internalValue && (enforceNumber || enforceInteger)) {
                const parsed = parseFloat(internalValue)
                if (enforceInteger) {
                    if (parsed != parseInt(internalValue)) {
                        await new Promise(resolve => setTimeout(resolve, 10))
                        setErrorMessage("정수만 입력 가능한 필드입니다.")
                        return;
                    }
                }
                if (isNaN(parsed)) {
                    // 잠시 여유를 주어서 ErrorMessage의 변경 사항을 React가 인식할 수 있도록 함?
                    // 이 방법이 최선은 아닌것 같은데 다른 방법을 찾아봐야 할듯
                    await new Promise(resolve => setTimeout(resolve, 10))
                    setErrorMessage("숫자만 입력 가능한 필드입니다.")
                    return;
                }
                if (enforceNumberRange) {
                    if (enforceNumberRange[0] > parsed || parsed > enforceNumberRange[1]) {
                        let range = `${enforceNumberRange[0]} ~ ${enforceNumberRange[1]}`
                        if (enforceNumberRange[0] == Number.MIN_VALUE) {
                            range = `${enforceNumberRange[1]} 이하`
                        }
                        if (enforceNumberRange[1] == Number.MAX_VALUE) {
                            range = `${enforceNumberRange[0]} 이상`
                        }

                        await new Promise(resolve => setTimeout(resolve, 10))
                        setErrorMessage(`적정 범위(${range}) 를 벗어났습니다.`)
                        return;
                    }
                }
            }

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
        if (!value) return getPlaceholder();

        if (hideOnIdle) {
            return "눌러서 확인하기"
        }

        return value
    }

    function getEditor() {
        // 클릭했을때 바로 나오는 항목이기 때문에, 이 항목은 autoFocus를 쓰는게 유저 경험상 더 바람직함
        // eslint-disable-next-line jsx-a11y/no-autofocus
        if (autoComplete) return (<Autocomplete className={"w-full"} disabled={inSubmit} autoFocus size={"sm"}
                                                allowsCustomValue
                                                defaultInputValue={internalValue}
                                                label={label}
                                                description={description}
                                                type={inputType}
                                                placeholder={placeholder}
                                                onInputChange={(value) => {
                                                    setInternalValue(value)
                                                }} endContent={inSubmit ? <CircularProgress/> : editButtonGroup}>
            <>{autoComplete}</>
        </Autocomplete>)

        if (useTextarea) {
            // eslint-disable-next-line jsx-a11y/no-autofocus
            return (<Textarea className={"w-full"} disabled={inSubmit} autoFocus size={"sm"} label={label}
                              defaultValue={internalValue}
                              description={description} type={inputType} placeholder={placeholder}
                              onValueChange={(value) => {
                                  setInternalValue(value)
                              }}
                              endContent={inSubmit ? <CircularProgress/> : editButtonGroup}>

            </Textarea>)
        }


        // eslint-disable-next-line jsx-a11y/no-autofocus
        return (<Input className={"w-full"} disabled={inSubmit} autoFocus size={"sm"} defaultValue={internalValue}
                       label={label}
                       description={description}
                       type={inputType}
                       placeholder={placeholder}
                       onValueChange={(value) => {
                           setInternalValue(value)
                       }} endContent={inSubmit ? <CircularProgress/> : editButtonGroup}/>)
    }

    return (<ErrorPopover errorMessage={errorMessage}>
        {inEdit ?
            <div>
                {getEditor()}
            </div>
            :
            <>
                <button className={"w-full flex flex-col cursor-text text-left"} onClick={startEditing}>
                    <span className={"text-xs"}>{label}</span>
                    <span
                        className={(value && !hideOnIdle ? '' : 'text-foreground-400 italic') + (useTextarea ? ' whitespace-pre-line' : '')}>{getDisplayValue()}</span>
                </button>
                {description && (!adaptiveDescriptionDisplay || (adaptiveDescriptionDisplay && !value)) &&
                    <span className={"w-full text-xs text-foreground-400"}>{description}</span>}
            </>
        }
    </ErrorPopover>)
}