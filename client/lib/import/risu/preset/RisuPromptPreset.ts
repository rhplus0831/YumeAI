// This code is based on code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/storage/database.svelte.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-13 for Change to fit with YumeAI

import {PromptItem, PromptSettings} from "./RisuPrompt"
import {OobaChatCompletionRequestParams} from "@/lib/import/risu/preset/RisuOOBA";

export type FormatingOrderItem =
    'main'
    | 'jailbreak'
    | 'chats'
    | 'lorebook'
    | 'globalNote'
    | 'authorNote'
    | 'lastChat'
    | 'description'
    | 'postEverything'
    | 'personaPrompt'

export interface OobaSettings {
    max_new_tokens: number,
    do_sample: boolean,
    temperature: number,
    top_p: number,
    typical_p: number,
    repetition_penalty: number,
    encoder_repetition_penalty: number,
    top_k: number,
    min_length: number,
    no_repeat_ngram_size: number,
    num_beams: number,
    penalty_alpha: number,
    length_penalty: number,
    early_stopping: boolean,
    seed: number,
    add_bos_token: boolean,
    truncation_length: number,
    ban_eos_token: boolean,
    skip_special_tokens: boolean,
    top_a: number,
    tfs: number,
    epsilon_cutoff: number,
    eta_cutoff: number,
    formating: {
        header: string,
        systemPrefix: string,
        userPrefix: string,
        assistantPrefix: string
        seperator: string
        useName: boolean
    }
}

interface AINsettings {
    top_p: number,
    rep_pen: number,
    top_a: number,
    rep_pen_slope: number,
    rep_pen_range: number,
    typical_p: number
    badwords: string
    stoptokens: string
    top_k: number
}

export interface NAISettings {
    topK: number
    topP: number
    topA: number
    tailFreeSampling: number
    repetitionPenalty: number
    repetitionPenaltyRange: number
    repetitionPenaltySlope: number
    repostitionPenaltyPresence: number
    seperator: string
    frequencyPenalty: number
    presencePenalty: number
    typicalp: number
    starter: string
    mirostat_lr?: number
    mirostat_tau?: number
    cfg_scale?: number
}

interface SeparateParameters {
    temperature?: number
    top_k?: number
    repetition_penalty?: number
    min_p?: number
    top_a?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
}

export enum LLMFormat {
    OpenAICompatible,
    OpenAILegacyInstruct,
    Anthropic,
    AnthropicLegacy,
    Mistral,
    GoogleCloud,
    VertexAIGemini,
    NovelList,
    Cohere,
    NovelAI,
    WebLLM,
    OobaLegacy,
    Plugin,
    Ooba,
    Kobold,
    Ollama,
    Horde,
    AWSBedrockClaude
}

export enum LLMFlags {
    hasImageInput,
    hasImageOutput,
    hasAudioInput,
    hasAudioOutput,
    hasPrefill,
    hasCache,
    hasFullSystemPrompt,
    hasFirstSystemPrompt,
    hasStreaming,
    requiresAlternateRole,
    mustStartWithUserInput,
    poolSupported,
    hasVideoInput,
    OAICompletionTokens,
    DeveloperRole,
    geminiThinking,
    geminiBlockOff
}

export interface CustomScript {
    comment: string;
    in: string
    out: string
    type: string
    flag?: string
    ableFlag?: boolean
}

export interface RisuPromptPreset {
    name?: string
    apiType?: string
    openAIKey?: string
    mainPrompt: string
    jailbreak: string
    globalNote: string
    temperature: number
    maxContext: number
    maxResponse: number
    frequencyPenalty: number
    PresensePenalty: number
    formatingOrder: FormatingOrderItem[]
    aiModel?: string
    subModel?: string
    currentPluginProvider?: string
    textgenWebUIStreamURL?: string
    textgenWebUIBlockingURL?: string
    forceReplaceUrl?: string
    forceReplaceUrl2?: string
    promptPreprocess: boolean,
    bias: [string, number][]
    proxyRequestModel?: string
    openrouterRequestModel?: string
    proxyKey?: string
    ooba: OobaSettings
    ainconfig: AINsettings
    koboldURL?: string
    NAISettings?: NAISettings
    autoSuggestPrompt?: string
    autoSuggestPrefix?: string
    autoSuggestClean?: boolean
    promptTemplate?: PromptItem[]
    NAIadventure?: boolean
    NAIappendName?: boolean
    localStopStrings?: string[]
    customProxyRequestModel?: string
    reverseProxyOobaArgs?: OobaChatCompletionRequestParams
    top_p?: number
    promptSettings?: PromptSettings
    repetition_penalty?: number
    min_p?: number
    top_a?: number
    openrouterProvider?: string
    useInstructPrompt?: boolean
    customPromptTemplateToggle?: string
    templateDefaultVariables?: string
    moduleIntergration?: string
    top_k?: number
    instructChatTemplate?: string
    JinjaTemplate?: string
    jsonSchemaEnabled?: boolean
    jsonSchema?: string
    strictJsonSchema?: boolean
    extractJson?: string
    groupTemplate?: string
    groupOtherBotRole?: string
    seperateParametersEnabled?: boolean
    seperateParameters?: {
        memory: SeparateParameters,
        emotion: SeparateParameters,
        translate: SeparateParameters,
        otherAx: SeparateParameters
    }
    customAPIFormat?: LLMFormat
    systemContentReplacement?: string
    systemRoleReplacement?: 'user' | 'assistant'
    openAIPrediction?: string
    enableCustomFlags?: boolean
    customFlags?: LLMFlags[]
    image?: string
    regex?: CustomScript[]
}

export const defaultAIN: AINsettings = {
    top_p: 0.7,
    rep_pen: 1.0625,
    top_a: 0.08,
    rep_pen_slope: 1.7,
    rep_pen_range: 1024,
    typical_p: 1.0,
    badwords: '',
    stoptokens: '',
    top_k: 140
}

export const defaultOoba: OobaSettings = {
    max_new_tokens: 180,
    do_sample: true,
    temperature: 0.7,
    top_p: 0.9,
    typical_p: 1,
    repetition_penalty: 1.15,
    encoder_repetition_penalty: 1,
    top_k: 20,
    min_length: 0,
    no_repeat_ngram_size: 0,
    num_beams: 1,
    penalty_alpha: 0,
    length_penalty: 1,
    early_stopping: false,
    seed: -1,
    add_bos_token: true,
    truncation_length: 4096,
    ban_eos_token: false,
    skip_special_tokens: true,
    top_a: 0,
    tfs: 1,
    epsilon_cutoff: 0,
    eta_cutoff: 0,
    formating: {
        header: "Below is an instruction that describes a task. Write a response that appropriately completes the request.",
        systemPrefix: "### Instruction:",
        userPrefix: "### Input:",
        assistantPrefix: "### Response:",
        seperator: "",
        useName: false,
    }
}

export const presetTemplate: RisuPromptPreset = {
    name: "New Preset",
    apiType: "gpt35_0301",
    openAIKey: "",
    mainPrompt: '',
    jailbreak: '',
    globalNote: "",
    temperature: 80,
    maxContext: 4000,
    maxResponse: 300,
    frequencyPenalty: 70,
    PresensePenalty: 70,
    formatingOrder: ['main', 'description', 'personaPrompt', 'chats', 'lastChat', 'jailbreak', 'lorebook', 'globalNote', 'authorNote'],
    aiModel: "gpt35_0301",
    subModel: "gpt35_0301",
    currentPluginProvider: "",
    textgenWebUIStreamURL: '',
    textgenWebUIBlockingURL: '',
    forceReplaceUrl: '',
    forceReplaceUrl2: '',
    promptPreprocess: false,
    proxyKey: '',
    bias: [],
    ooba: defaultOoba,
    ainconfig: defaultAIN,
    reverseProxyOobaArgs: {
        mode: 'instruct'
    },
    top_p: 1,
    useInstructPrompt: false,
}