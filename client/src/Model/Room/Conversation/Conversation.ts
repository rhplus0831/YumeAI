import BaseData from "../../Base/BaseData.ts";

export default interface Conversation extends BaseData {
    room_id: number
    created_at: Date
    user_message: string | null
    assistant_message: string | null
}