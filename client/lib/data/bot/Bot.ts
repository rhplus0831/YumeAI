import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";
import {api} from "@/lib/api-client";
import Persona from "@/lib/data/Persona";

export default interface Bot extends Persona, BaseData, ProfileImage {
    first_message: string | undefined
    image_assets: string | undefined
}

type PartialBot = Partial<Bot>;

export async function getBots(): Promise<Bot[]> {
    return await api('bot', {
        method: 'GET'
    })
}

export async function getBot(id: string): Promise<Bot> {
    return await api(`bot/${id}`, {
        method: 'GET'
    })
}

export async function createBot(name: string): Promise<Bot> {
    return await api('bot', {
        method: 'POST',
        body: JSON.stringify({
            "name": name,
            "displayName": "",
            "prompt": "",
            "first_message": ""
        })
    })
}

export async function putBot(id: string, data: PartialBot): Promise<Bot> {
    return await api(`bot/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deleteBot(id: string): Promise<void> {
    return await api(`bot/${id}`, {
        method: 'DELETE'
    })
}