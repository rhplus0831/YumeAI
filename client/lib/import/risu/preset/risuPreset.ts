// This code is based on code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/storage/database.svelte.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-13 for Change to fit with YumeAI

import LoadedFile from "@/lib/LoadedFile";
import {decodeRPack} from "@/lib/import/rpack/rpack_bg";
import * as fflate from "fflate";
import {decode as decodeMsgpack} from "msgpackr";
import {PromptBase} from "@/lib/data/Prompt";
import {decryptBuffer} from "@/lib/import/risu/risuUtil";
import {presetTemplate, RisuPromptPreset} from "@/lib/import/risu/preset/RisuPromptPreset";
import {getLLMByModal} from "@/lib/import/risu/preset/modelList";
import {PromptItemChat, PromptItemTyped, PromptTypeToStr} from "@/lib/import/risu/preset/RisuPrompt";

export interface RisuPresetHeader {
    presetVersion: number,
    type: string,
    preset?: Uint8Array
    pres?: Uint8Array
}

export async function decodeRisuPreset(file: LoadedFile): Promise<RisuPromptPreset> {
    let data = file?.data
    if (file.name.endsWith('.risup')) {
        data = await decodeRPack(data)
    }
    const decoded: RisuPresetHeader = await decodeMsgpack(fflate.decompressSync(data))
    if (decoded.presetVersion !== 0 && decoded.presetVersion !== 2) {
        throw new Error('Invalid Risu preset version')
    }
    if (decoded.type !== 'preset') {
        throw new Error('Invalid Risu preset')
    }

    return {...presetTemplate, ...decodeMsgpack(Buffer.from(await decryptBuffer(decoded.preset ?? decoded.pres, 'risupreset')))}
}

export async function parseRisuPrompt(file: LoadedFile): Promise<PromptBase> {
    const pre = await decodeRisuPreset(file)
    const llm = getLLMByModal(pre.aiModel)
    let llm_config: Record<string, any> = {}

    function applyIfExist(key: string, value: any) {
        if (value) {
            llm_config[key] = value
        }
    }

    applyIfExist('model', pre.aiModel)
    applyIfExist('max_input', pre.maxContext)
    applyIfExist('max_output', pre.maxResponse)
    applyIfExist('presence_penalty', pre.PresensePenalty)
    applyIfExist('frequency_penalty', pre.frequencyPenalty)
    applyIfExist('temperature', pre.temperature)
    applyIfExist('top_p', pre.top_p)
    applyIfExist('top_k', pre.top_k)

    let prompt = ''

    function putRole(role: 'user' | 'bot' | 'system') {
        if (role === 'user') {
            prompt += '||user||\n'
        } else if (role === 'bot') {
            prompt += '||assistant||\n'
        } else if (role === 'system') {
            prompt += '||system||\n'
        }
    }

    function putSlot(p: PromptItemTyped, ...slot: string[]) {
        if (slot.length === 0) return
        let mySlot = ''
        for (const s of slot) {
            mySlot += `{{${s}}}\n`
        }
        mySlot = mySlot.slice(0, -1)
        prompt += ((p as PromptItemTyped).innerFormat ?? '{{slot}}').replaceAll("{{slot}}", mySlot) + '\n'
    }

    pre.promptTemplate?.forEach(p => {
        prompt += `//YUME ${p.name?.trim() ?? PromptTypeToStr(p.type)}\n`
        switch (p.type) {
            case 'plain':
                if (p.text.trim() === '') return
                putRole(p.role)
                prompt += p.text + '\n'
                break
            case 'persona':
                putRole('user')
                putSlot(p as PromptItemTyped, 'user_prompt')
                break
            case 'description':
                putRole('bot')
                putSlot(p as PromptItemTyped, 'char_prompt')
                break
            case 'memory':
                putRole('system')
                putSlot(p as PromptItemTyped, 'summaries', 're_summaries')
                break
            case 'chat':
                const pp = p as PromptItemChat
                if (pp.rangeStart === 0 && pp.rangeEnd === 'end') {
                    prompt += '{{chat}}\n'
                } else if (pp.rangeStart === 0 && pp.rangeEnd === -1) {
                    prompt += '{{conversations}}\n'
                } else if (pp.rangeStart === -1 && pp.rangeEnd === 'end') {
                    prompt += '{{message}}\n'
                } else {
                    prompt += '//YUME YumeAI는 아직 메시지의 상세한 범위를 지정할 수 없습니다.\n'
                }
                break
        }
    })

    let result: PromptBase = {
        name: pre.name ?? 'Imported',
        type: 'chat',
        llm: getLLMByModal(pre.aiModel),
        llm_config: JSON.stringify(llm_config),
        prompt: prompt,
        filters: '',
        toggles: pre.customPromptTemplateToggle ?? '',
        use_stream: false,
    }

    return result
}