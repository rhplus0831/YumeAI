import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";

export default interface Bot extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
    first_message: string
}