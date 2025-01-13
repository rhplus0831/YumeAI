// This code is copy of code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/process/prompt.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.
// Modifications Made by RH+ on 2025-01-13 for Change to fit with YumeAI

export type PromptItem = PromptItemPlain|PromptItemTyped|PromptItemChat|PromptItemAuthorNote|PromptItemChatML
export type PromptType = PromptItem['type'];

export function PromptTypeToStr(type:PromptType){
    const map = {
        "plain": "순수 프롬프트",
        "jailbreak": "탈옥 프롬프트",
        "cot": "생각의 사슬",
        "main": "메인 프롬프트",
        "chat": "챗",
        "chats": "과거 채팅",
        "lorebook": "로어북",
        "globalNote": "글로벌 노트",
        "authornote": "작가의 노트",
        "lastChat": "마지막 채팅",
        "description": "캐릭터 설명",
        "persona": "페르소나 프롬프트",
        "memory": "장기 기억",
        "postEverything": "최종 삽입 프롬프트",
        "chatML": "ChatML",
    }

    return map[type] || type
}

export type PromptSettings = {
    assistantPrefill: string
    postEndInnerFormat: string
    sendChatAsSystem: boolean
    sendName: boolean
    utilOverride: boolean
    customChainOfThought?: boolean
    maxThoughtTagDepth?: number
}

export interface PromptItemPlain {
    type: 'plain'|'jailbreak'|'cot';
    type2: 'normal'|'globalNote'|'main'
    text: string;
    role: 'user'|'bot'|'system';
    name?: string
}

export interface PromptItemChatML {
    type: 'chatML'
    text: string
    name?: string
}

export interface PromptItemTyped {
    type: 'persona'|'description'|'lorebook'|'postEverything'|'memory'
    innerFormat?: string,
    name?: string
}

export interface PromptItemAuthorNote {
    type : 'authornote'
    innerFormat?: string
    defaultText?: string
    name?: string
}


export interface PromptItemChat {
    type: 'chat';
    rangeStart: number;
    rangeEnd: number|'end';
    chatAsOriginalOnSystem?: boolean;
    name?: string
}