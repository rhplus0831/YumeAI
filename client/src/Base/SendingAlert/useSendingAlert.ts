//Heavy Reference: https://github.com/chakra-ui/chakra-ui/blob/20fd42bee9e59f01eef2ce9dd9bf4630c1511a68/packages/hooks/src/use-disclosure.ts

import {useCallback, useState} from "react";
import {useCallbackRef} from "@chakra-ui/react";

export interface UseSendingAlertProps {
    display?: boolean

    onClose?(): void

    onOpen?: () => void

    alertStatus?: "info" | "warning" | "success" | "error" | "loading" | undefined
    alertTitle?: string
    alertDescription?: string

    setAlertStatus?: (alertStatus?: "info" | "warning" | "success" | "error" | "loading" | undefined) => void
    setAlertTitle?: (alertTitle?: string) => void
    setAlertDescription?: (description?: string) => void
}

export function useSendingAlert(props: UseSendingAlertProps = {}) {
    const {
        onClose: onCloseProp,
        onOpen: onOpenProp,
        display: displayProp,
        alertStatus: alertStatusProp,
        alertTitle: alertTitleProp,
        alertDescription: alertDescriptionProp,
        setAlertStatus: setAlertStatusProp,
        setAlertTitle: setAlertTitleProp,
        setAlertDescription: setAlertDescriptionProp,
    } = props

    const handleOpen = useCallbackRef(onOpenProp)
    const handleClose = useCallbackRef(onCloseProp)

    const handleAlertStatus = useCallbackRef(setAlertStatusProp)
    const handleAlertTitle = useCallbackRef(setAlertTitleProp)
    const handleAlertDescription = useCallbackRef(setAlertDescriptionProp)

    const [displayState, setDisplayState] = useState<boolean>(false)

    const [alertStatusState, setAlertStatusState] = useState<"info" | "warning" | "success" | "error" | "loading" | undefined>(alertStatusProp ? alertStatusProp : "loading")
    const [alertTitleState, setAlertTitleState] = useState<string>(alertTitleProp ? alertTitleProp : "")
    const [alertDescriptionState, setAlertDescriptionState] = useState<string>(alertDescriptionProp ? alertDescriptionProp : "")

    const display = displayProp !== undefined ? displayProp : displayState
    const alertStatus = alertStatusProp !== undefined ? alertStatusProp : alertStatusState
    const alertTitle = alertTitleProp !== undefined ? alertTitleProp : alertTitleState
    const alertDescription = alertDescriptionProp !== undefined ? alertDescriptionProp : alertDescriptionState

    const onOpen = useCallback(() => {
        setDisplayState(true)
    }, [handleOpen])

    const onClose = useCallback(() => {
        setDisplayState(false)
    }, [handleClose])

    const setAlertStatus = useCallback((alertStatus?: "info" | "warning" | "success" | "error" | "loading" | undefined) => {
        setAlertStatusState(alertStatus ? alertStatus : "error")
    }, [handleAlertStatus])

    const setAlertTitle = useCallback((alertTitle?: string) => {
        setAlertTitleState(alertTitle ? alertTitle : "")
    }, [handleAlertTitle])

    const setAlertDescription = useCallback((alertDescription?: string) => {
        setAlertDescriptionState(alertDescription ? alertDescription : "")
    }, [handleAlertDescription])

    return {
        display,
        onOpen,
        onClose,
        alertStatus,
        alertTitle,
        alertDescription,
        setAlertStatus,
        setAlertTitle,
        setAlertDescription
    }
}

export async function notifyFetch(url: string, props: UseSendingAlertProps, extra: RequestInit, progressMessage: string, isStreaming: boolean = false, streamingReceiver?: (data: unknown) => void) {
    props.setAlertStatus?.("loading")
    props.setAlertTitle?.("통신중")
    props.setAlertDescription?.(progressMessage)
    props.onOpen?.()

    const throwError = (props: UseSendingAlertProps, detail: string = "") => {
        props.setAlertStatus?.("error")
        props.setAlertTitle?.("오류 발생")
        props.setAlertDescription?.("오류가 발생했습니다: " + detail)
        throw new Error(detail)
    }

    try {
        const response = await fetch(url, extra)
        if (!isStreaming) {
            const data = await response.json()
            if (!response.ok) {
                if (typeof (data.detail) !== "string") {
                    throwError(props, data.detail[0].msg)
                } else {
                    throwError(props, data.detail)
                }
                return
            }
            props.onClose?.()
            return data
        } else {
            let result = {}
            let received = false
            const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader()
            while (true) {
                const {value, done} = await reader.read();
                if (done) break;
                if (!value) continue;
                let buffer = value
                let boundary = value.indexOf('\n');
                if (boundary === -1) {
                    boundary = buffer.length;
                }
                while (boundary !== -1) {
                    const jsonString = buffer.substring(0, boundary);
                    console.log(jsonString)
                    const jsonValue = JSON.parse(jsonString)
                    if (Object.prototype.hasOwnProperty.call(jsonValue, 'status')) {
                        if (jsonValue['status'] == 'progress') {
                            props.setAlertDescription?.(jsonValue['message'])
                        } else if (jsonValue['status'] == 'error') {
                            // noinspection ExceptionCaughtLocallyJS
                            throw new Error(jsonValue['message'])
                        } else if (jsonValue['status'] == 'stream') {
                            if (streamingReceiver) {
                                streamingReceiver(jsonValue)
                            }
                        }
                    } else {
                        result = jsonValue
                        received = true
                    }
                    // 처리한 부분을 버퍼에서 제거
                    buffer = buffer.substring(boundary + 1);
                    // 다음 JSON의 경계를 찾습니다.
                    boundary = buffer.indexOf('\n');
                }
            }
            if (!received) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("서버가 응답을 제대로 하지 않았거나 그 전에 연결이 끊어졌습니다.")
            }
            props.onClose?.()
            return result
        }
    } catch (err: unknown) {
        console.log(err)
        if (err instanceof Error) {
            throwError(props, err.message)
        }
    }

    props.onClose?.()
}