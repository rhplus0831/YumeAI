import {api} from "@/lib/api-client";

export default interface Image {
    file_id: string
    file_type: string
}

export async function deleteImage(id: string) {
    return await api(`image/${id}`, {
        method: "DELETE"
    })
}