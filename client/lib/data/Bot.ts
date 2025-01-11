import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";
import {api} from "@/lib/api-client";
import Persona from "@/lib/data/Persona";

export default interface Bot extends Persona, BaseData, ProfileImage {
    first_message: string
}

export async function getBots(): Promise<Bot[]> {
    return await api('bot', {
        method: 'GET'
    })
}