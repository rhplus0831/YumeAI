import {api} from "@/lib/api-client";

export default interface OperationLog {
    id: string,
    related_room_id: string,
    related_conversation_id: string,
    title: string,
    message: string
}

export async function getRoomLog(roomId: string): Promise<OperationLog[]> {
    return await api(`room/${roomId}/log`, {
        method: 'GET'
    })
}