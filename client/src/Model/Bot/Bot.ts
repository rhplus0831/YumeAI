import BaseData from "../Base/BaseData.ts";
import {ProfileImage} from "../Base/UploadableProfileBox.tsx";

export default interface Bot extends BaseData, ProfileImage {
    name: string
    displayName: string
    prompt: string
    first_message: string
}