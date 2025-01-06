import BaseData from "@/lib/data/BaseData";
import Summary from "@/lib/data/Summary";

export default interface Conversation extends BaseData {
    room_id: number
    created_at: Date
    user_message: string | null
    user_message_translated: string | null
    assistant_message: string | null
    assistant_message_translated: string | null
    summary: Summary | null
    summary_id: number | null
}