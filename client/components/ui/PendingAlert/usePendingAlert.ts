import {useState} from "react";

export function usePendingAlert() {
    const [display, setDisplay] = useState<boolean>(false)
    function onClose() {
        setDisplay(false)
    }
    function onOpen() {
        setDisplay(true)
    }

    const [alertStatus, setAlertStatus] = useState<"info" | "warning" | "success" | "error" | "loading" | undefined>(undefined)
    const [alertTitle, setAlertTitle] = useState<string>("")
    const [alertDescription, setAlertDescription] = useState<string>("")

    return {
        display,
        onClose,
        onOpen,
        alertStatus,
        alertTitle,
        alertDescription,
        setAlertStatus,
        setAlertTitle,
        setAlertDescription,
    }
}
export type UsePendingAlertReturn = ReturnType<typeof usePendingAlert>;

export async function pendingFetch(url: string, props: UsePendingAlertReturn, extra: RequestInit, progressMessage: string, isStreaming: boolean = false, streamingReceiver?: (data: unknown) => void) {
    props.setAlertStatus?.("loading")
    props.setAlertTitle?.("통신중")
    props.setAlertDescription?.(progressMessage)
    props.onOpen?.()

    const throwError = (props: UsePendingAlertReturn, detail: string = "") => {
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
                        await reader.cancel('Received Result')
                        break
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

