import BaseData from "@/lib/data/BaseData";
import {api} from "@/lib/api-client";
import Conversation from "@/lib/data/Conversation";

export default interface Summary extends BaseData {
    content: string
    is_top: boolean
}

export async function reRollSummary(conversation: Conversation): Promise<Summary> {
    return await api(`room/${conversation.room_id}/summary/${conversation.id}/re_roll`, {
        method: 'POST'
    })
}