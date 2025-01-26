import {api} from "@/lib/api-client";

export default interface Image {
    file_id: string
    file_type: string
}

export async function uploadImage(endpoint: string, file: Blob, file_field: string, id_field = 'file_id') {
    if(localStorage.getItem("useEncrypt") !== "true") {
        const formData = new FormData()
        formData.append(file_field, file)
        return await api(endpoint, {
            method: "POST",
            cache: "no-cache",
            body: formData
        }, false)
    }

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(localStorage.getItem("assetKey")!).slice(0, 32),
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const arrayBuffer = await file.arrayBuffer();

    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        arrayBuffer
    );

    const formData = new FormData()
    formData.append(file_field, new Blob([iv, encryptedData], { type: file.type }))
    const data = await api(endpoint, {
        method: "POST",
        cache: "no-cache",
        body: formData
    }, false)

    try {
        //Cache if secure context (service worker is exist)
        if (window.isSecureContext) {
            await fetch('/sw/image', {
                method: 'PUT',
                body: new Blob([arrayBuffer]),
                headers: {
                    'x-file-id': data[id_field],
                    'x-file-type': file.type
                }
            })
        }
    } catch (error) {
        console.error(error)
    }

    return data
}

export async function deleteImage(id: string) {
    return await api(`image/${id}`, {
        method: "DELETE"
    })
}

export function buildImageLink(id: string | undefined, size: string = "original") {
    if (!id) return undefined
    // TODO: Revive size
    return `/api/image/${id}`
}