// This code is based on code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/translator/translator.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-11 for Change to fit with YumeAI

import {UsePendingAlertReturn} from "@/components/ui/PendingAlert/usePendingAlert";

function splitByBraces(text: string): string[] {
    return text.split(/({{.*?}}|}})/g).filter(Boolean);
}

export async function googleTranslate(text: string, props: UsePendingAlertReturn, streamingReceiver?: (message: string) => void) {
    const messages = text.split("\n")

    const throwError = (props: UsePendingAlertReturn, detail: string = "") => {
        props.setAlertStatus?.("error")
        props.setAlertTitle?.("오류 발생")
        props.setAlertDescription?.("오류가 발생했습니다: " + detail)
        throw new Error(detail)
    }

    const updateStatus = (index: number) => {
        props.setAlertDescription?.(`${index + 1}번째 줄 번역중`)
    }

    try {
        props.setAlertStatus?.("loading")
        props.setAlertTitle?.("구글 번역중...")
        updateStatus(0)
        props.onOpen?.()

        for(let index = 0; index < messages.length; index++) {
            updateStatus(index)
            const message = messages[index]
            if (index !== 0) {
                streamingReceiver?.("\n")
            }
            const splited = splitByBraces(message)
            for (let i = 0; i < splited.length; i++) {
                const part = splited[i]
                if (part.startsWith("{{") && part.endsWith("}}")) {
                    streamingReceiver?.(part)
                } else {
                    const translated = await translateLine('auto', 'ko', part)
                    streamingReceiver?.(translated)
                }
            }
        }
    } catch (err: unknown) {
        console.log(err)
        if (err instanceof Error) {
            throwError(props, err.message)
        }
    }
    props.onClose?.()
}

async function translateLine(from: string, to: string, text: string) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${from}&tl=${to}&q=` + encodeURIComponent(text)
    const response = await fetch(url, {method: 'GET'})
    const json = await response.json()
    if (typeof (json) === 'string') {
        return json as string
    }

    if ((!json[0]) || json[0].length === 0) {
        return text
    }

    return (json[0].map((s: string) => s[0]).filter(Boolean).join('') as string).replace(/\* ([^*]+)\*/g, '*$1*').replace(/\*([^*]+) \*/g, '*$1*');
}