// This code is based on code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/storage/database.svelte.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-13 for Change to fit with YumeAI

import LoadedFile from "@/lib/data/LoadedFile";
import {decodeRPack} from "@/lib/import/rpack/rpack_bg";
import * as fflate from "fflate";
import {decode as decodeMsgpack} from "msgpackr";
import Prompt from "@/lib/data/Prompt";
import {decryptBuffer} from "@/lib/import/risu/risuUtil";
import {presetTemplate, RisuPromptPreset} from "@/lib/import/risu/preset/RisuPromptPreset";
import {getLLMByModal} from "@/lib/import/risu/preset/modelList";
import OpenAIConfig from "@/lib/data/llm/OpenAIConfig";
import GeminiConfig from "@/lib/data/llm/GeminiConfig";
import {PromptItemChat, PromptItemTyped} from "@/lib/import/risu/preset/RisuPrompt";

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
    if(decoded.presetVersion !== 0 && decoded.presetVersion !== 2) {
        throw new Error('Invalid Risu preset version')
    }
    if(decoded.type !== 'preset'){
        throw new Error('Invalid Risu preset')
    }

    return {...presetTemplate,...decodeMsgpack(Buffer.from(await decryptBuffer(decoded.preset ?? decoded.pres, 'risupreset')))}
}

export async function parseRisuPrompt(file: LoadedFile): Promise<Prompt> {
    const pre = await decodeRisuPreset(file)
    const llm = getLLMByModal(pre.aiModel)
    let llm_config = ""
    switch(llm) {
        case "openai":
            const openAIConfig: OpenAIConfig = {
                endpoint: '',
                model: pre.aiModel ?? 'gpt-4o',
                key: '',
                temperature: pre.temperature,
                max_tokens: pre.maxResponse,
                top_p: pre.top_p ?? 1,
                frequency_penalty: pre.frequencyPenalty,
                presence_penalty: pre.PresensePenalty
            }
            llm_config = JSON.stringify(openAIConfig)
            break;
        case "gemini":
            const geminiConfig: GeminiConfig = {
                model: pre.aiModel ?? 'gemini-1.5-pro',
                key: ''
            }
            llm_config = JSON.stringify(geminiConfig)
            break;
    }

    let prompt = ''

    function putRole(role: 'user'|'bot'|'system') {
        if(role === 'user') {
            prompt += '||user||\n'
        } else if(role === 'bot') {
            prompt += '||assistant||\n'
        } else if(role === 'system') {
            prompt += '||system||\n'
        }
    }

    function putSlot(p: PromptItemTyped, slot: string) {
        prompt += ((p as PromptItemTyped).innerFormat ?? '{{slot}}').replaceAll("{{slot}}", `{{${slot}}}`) + '\n'
    }

    pre.promptTemplate?.forEach(p => {
        prompt += `//YUME ${p.name ?? ''}\n`
        switch (p.type) {
            case 'plain':
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
                putSlot(p as PromptItemTyped, 'summaries')
                putSlot(p as PromptItemTyped, 're_summaries')
                break
            case 'chat':
                const pp = p as PromptItemChat
                if(pp.rangeStart === 0 && pp.rangeEnd === 'end') {
                    prompt += '{{chat}}\n'
                }  else if (pp.rangeStart === 0 && pp.rangeEnd === -1) {
                    prompt += '{{conversations}}\n'
                } else if (pp.rangeStart === -1 && pp.rangeEnd === 'end') {
                    prompt += '{{message}}\n'
                } else {
                    prompt += '//YUME YumeAI는 아직 메시지의 상세한 범위를 지정할 수 없습니다.\n'
                }
                break
        }
    })

    let result: Prompt = {
        name: pre.name ?? 'Imported',
        type: 'chat',
        llm: getLLMByModal(pre.aiModel),
        llm_config: llm_config,
        prompt: prompt,
        filters: '',
        id: -1
    }

    return result
}