import BaseData from "@/lib/data/BaseData";
import Summary from "@/lib/data/Summary";

export interface RawConversation extends BaseData {
    room_id: string
    created_at: Date
    user_message: string | null
    user_message_translated: string | null
    assistant_message: string | null
    assistant_message_translated: string | null
    summary_id: string | null
}

export default interface Conversation extends RawConversation {
    summary: Summary | null
}