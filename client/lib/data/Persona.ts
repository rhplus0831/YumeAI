import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";

export default interface Persona extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
}