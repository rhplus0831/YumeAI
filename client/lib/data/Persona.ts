import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";
import {api} from "@/lib/api-client";

export default interface Persona extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
}

export async function getPersonas(): Promise<Persona[]> {
    return await api('persona', {
        method: 'GET'
    })
}