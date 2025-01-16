import BaseData from "./BaseData"
import Bot from "@/lib/data/Bot";
import Persona from "@/lib/data/Persona";
import Prompt from "@/lib/data/Prompt";
import {api, buildAPILink} from "@/lib/api-client";
import Conversation from "@/lib/data/Conversation";

export default interface Room extends BaseData {
    name: string
    bot: Bot | undefined,
    persona: Persona | undefined,
    prompt: Prompt | undefined,
    summary_prompt: Prompt | undefined
    re_summary_prompt: Prompt | undefined
    translate_method: string | undefined
    translate_prompt: Prompt | undefined
    translate_only_assistant: boolean
}

export async function createRoom(name: string): Promise<Room> {
    return await api('room', {
        method: 'POST',
        body: JSON.stringify({"name": name})
    })
}

export async function getRooms(): Promise<Room[]> {
    return await api('room', {
        method: 'GET'
    })
}

export async function getRoom(id: number): Promise<Room> {
    return await api(`room/${id}`, {
        method: 'GET'
    })
}

export async function putRoom(id: number, data: {}): Promise<Room> {
    return await api(`room/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deleteRoom(id: number): Promise<Room> {
    return await api(`room/${id}`, {
        method: 'DELETE'
    })
}

export async function getConversations(room: Room): Promise<Conversation[]> {
    return await api(`room/${room.id}/conversation`, {
        method: 'GET'
    })
}

export async function applyFirstMessage(id: number): Promise<Conversation> {
    return await api(`room/${id}/conversation/apply_first_message`, {
        method: 'POST'
    })
}