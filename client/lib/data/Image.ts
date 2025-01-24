import {api} from "@/lib/api-client";

export default interface Image {
    file_id: string
    file_type: string
}

function resizeAndCropImage(file: File, targetSize: number): Promise<Blob> {
    // TODO: Support gif on asset encrypt
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Create a canvas element
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Canvas context is not available"));
                    return;
                }

                // Set canvas dimensions to the target size
                canvas.width = targetSize;
                canvas.height = targetSize;

                // Calculate crop dimensions
                const scale = Math.min(img.width / targetSize, img.height / targetSize);
                const cropWidth = targetSize * scale;
                const cropHeight = targetSize * scale;
                const cropX = (img.width - cropWidth) / 2;
                const cropY = (img.height - cropHeight) / 2;

                // Draw the image with cropping on the canvas
                ctx.drawImage(
                    img,
                    cropX,
                    cropY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    targetSize,
                    targetSize
                );

                // Convert canvas to a Blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("Failed to create blob from canvas"));
                    }
                }, "image/jpeg");
            };

            img.onerror = () => reject(new Error("Failed to load image"));

            // Load image data into the img element
            if (event.target && event.target.result) {
                img.src = event.target.result as string;
            }
        };

        // Read the file as Data URL
        reader.readAsDataURL(file);
    });
}

export async function uploadImage(endpoint: string, file: File, file_field: string) {

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
    return await api(endpoint, {
        method: "POST",
        cache: "no-cache",
        body: formData
    }, false)
}

export async function deleteImage(id: string) {
    return await api(`image/${id}`, {
        method: "DELETE"
    })
}