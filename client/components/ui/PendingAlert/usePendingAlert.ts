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

function splitStream(separator: string) {
    let buffer = '';
    return new TransformStream({
        transform(chunk, controller) {
            buffer += chunk;
            const parts = buffer.split(separator);
            buffer = parts.pop() ?? ''; // 마지막 부분은 다음 청크와 결합될 수 있으므로 버퍼에 저장
            parts.forEach(part => controller.enqueue(part));
        },
        flush(controller) {
            if (buffer) {
                controller.enqueue(buffer); // 남은 버퍼 처리
            }
        }
    });
}

function parseEvent(message: string) {
    const event: Record<string, string> = {};
    const lines = message.trim().split('\n');
    for (const line of lines) {
        const spliter = line.indexOf(':');
        if(spliter === -1) {
            continue;
        }
        const key = line.slice(0, spliter).trim();
        const value = line.slice(spliter + 1).trim().replaceAll("__YUME_LINE__", "\n");

        if (key && value) {
            event[key] = value;
        }
    }
    // console.log(event)
    return event;
}

export async function pendingFetch(url: string, props: UsePendingAlertReturn, extra: RequestInit, progressMessage: string, isStreaming: boolean = false, streamingReceiver?: (message: string) => void) {
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
            const reader = response.body!
                .pipeThrough(new TextDecoderStream()) // 바이트 스트림을 텍스트 스트림으로 변환
                .pipeThrough(splitStream('\n\n')) // 각 이벤트 메시지별로 스트림 분할
                .getReader();

            let complete = false;
            let data = {};

            try {
                while (true) {
                    const {done, value} = await reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        const event = parseEvent(value); // 이벤트 메시지 파싱
                        if (event.type === "complete") {
                            complete = true;
                            data = JSON.parse(event.data);
                        } else if (event.type === "progress") {
                            props.setAlertDescription?.(event.data)
                        } else if (event.type === "stream") {
                            streamingReceiver?.(event.data)
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            if (!complete) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("서버가 응답을 제대로 하지 않았거나 그 전에 연결이 끊어졌습니다.")
            }

            props.onClose?.()
            return data;
        }
    } catch (err: unknown) {
        console.log(err)
        if (err instanceof Error) {
            throwError(props, err.message)
        }
    }

    props.onClose?.()
}

