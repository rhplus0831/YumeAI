import BaseData from "../Base/BaseData.ts";
import {ProfileImage} from "../Base/UploadableProfileBox.tsx";

export default interface Persona extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
}