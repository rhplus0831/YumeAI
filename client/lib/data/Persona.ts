import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";
import {api} from "@/lib/api-client";

export default interface Persona extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
}

type PartialPersona = Partial<Persona>;

export async function getPersonas(): Promise<Persona[]> {
    return await api('persona', {
        method: 'GET'
    })
}

export async function createPersona(name: string) : Promise<Persona> {
    return await api('persona', {
        method: 'POST',
        body: JSON.stringify({
            "name": name,
            "displayName": "",
            "prompt": ""
        })
    })
}

export async function getPersona(id: string) : Promise<Persona> {
    return await api(`persona/${id}`, {
        method: 'GET'
    })
}

export async function putPersona(id: string, data: PartialPersona) : Promise<Persona> {
    return await api(`persona/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deletePersona(id: string) : Promise<void> {
    return await api(`persona/${id}`, {
        method: 'DELETE'
    })
}