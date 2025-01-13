// This code contains cherry picked code from RisuAI(https://github.com/kwaroran/RisuAI/blob/main/src/ts/util.ts)
// Copyright (C) 2024 Kwaroran. Licensed under the GNU General Public License v3.0.

export async function decryptBuffer(data:Uint8Array | undefined, keys:string){
    if(!data) throw new Error("data is undefined")
    // hash the key to get a fixed length key value
    const keyArray = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(keys))

    const key = await window.crypto.subtle.importKey(
        "raw",
        keyArray,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    )

    // use web crypto api to encrypt the data
    const result = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: new Uint8Array(12),
        },
        key,
        data
    )

    return result
}