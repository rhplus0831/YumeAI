// This code is based on code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/translator/translator.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-11 for Change to fit with YumeAI

import {UsePendingAlertReturn} from "@/components/ui/PendingAlert/usePendingAlert";

export async function googleTranslate(text: string, props: UsePendingAlertReturn, streamingReceiver?: (data: unknown) => void) {
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

        for (const message of messages) {
            const index = messages.indexOf(message);
            updateStatus(index)
            const translated = await translateLine('auto', 'ko', message)
            streamingReceiver?.({
                "message": translated + '\n'
            })
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