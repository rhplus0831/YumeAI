import BaseData from "@/lib/data/BaseData";
import ProfileImage from "@/lib/data/ProfileImage";
import {api} from "@/lib/api-client";
import Persona from "@/lib/data/Persona";
import Image, {uploadImage} from "@/lib/data/Image";
// @ts-ignore
import mimedb from 'mime-db'
// @ts-ignore
import {MimeType} from 'mime-type'
import * as fflate from "fflate";

export default interface Bot extends Persona, BaseData, ProfileImage {
    post_prompt: string | undefined
    first_message: string | undefined
    image_assets: string | undefined
}

type PartialBot = Partial<Bot>;

export async function getBots(): Promise<Bot[]> {
    return await api('bot', {
        method: 'GET'
    })
}

export async function getBot(id: string): Promise<Bot> {
    return await api(`bot/${id}`, {
        method: 'GET'
    })
}

export async function createBot(name: string): Promise<Bot> {
    return await api('bot', {
        method: 'POST',
        body: JSON.stringify({
            "name": name,
            "displayName": "",
            "prompt": "",
            "first_message": ""
        })
    })
}

export async function putBot(id: string, data: PartialBot): Promise<Bot> {
    return await api(`bot/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    })
}

export async function deleteBot(id: string): Promise<void> {
    return await api(`bot/${id}`, {
        method: 'DELETE'
    })
}

export async function importBotFromZip(arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) {
    return new Promise<void>((resolve, reject) => {
        try {
            // fflate.unzipSync 대신 비동기 unzip 사용 (더 큰 파일에 적합)
            fflate.unzip(new Uint8Array(arrayBuffer), async (err, zipData) => {
                if (err || !zipData) {
                    throw new Error(`Error unzipping file: ${err?.message}`);
                }
                if (!zipData['card.json']) {
                    throw new Error("Invalid file - 'card.json' not found");
                }

                const cardJsonData = new TextDecoder().decode(zipData['card.json']);
                const card = JSON.parse(cardJsonData);

                if (card['spec'] !== 'chara_card_v3') {
                    throw new Error("Invalid card spec");
                }

                const data = card['data'];

                setLoadingStatus("봇 카드 등록하는중...");
                const bot = await createBot(data['name'])

                const firstMessages: { name: string; message: string }[] = [];
                const imageAssets: { name: string; alias: string; imageId: string }[] = [];

                // Safe key access
                const safeGet = <T>(key: string): T | undefined => data[key] || undefined;

                if (safeGet<string>('first_mes')) {
                    firstMessages.push({
                        name: '기본',
                        message: data['first_mes'],
                    });
                }

                if (safeGet<string[]>('alternate_greetings')) {
                    safeGet<string[]>('alternate_greetings')!.forEach((greeting, index) => {
                        firstMessages.push({
                            name: `${index}번째 메시지`,
                            message: greeting,
                        });
                    });
                }

                if (safeGet<{ type: string; uri: string; name: string; ext: string }[]>('assets')) {
                    const assets = safeGet<{ type: string; uri: string; name: string; ext: string }[]>('assets')!;
                    for (const asset of assets) {
                        const {type, uri, name, ext} = asset;
                        if (!uri.startsWith('embeded://')) {
                            continue; // Skipping non-embedded assets
                        }

                        const mtype = new MimeType(mimedb)
                        const mockFileName = 'data.' + ext
                        const mime: string = mtype.lookup(mockFileName);
                        if (!mime) {
                            console.error(`MIME type for file "${name}"(${mockFileName}) not found`);
                            continue;
                        }

                        // Extract path from the URI
                        const innerPath = uri.replace('embeded://', '');

                        const fileData = zipData[innerPath];
                        if (!fileData) {
                            console.error(`File data for path "${innerPath}" not found in ZIP`);
                            continue;
                        }

                        if (type === "icon") {
                            setLoadingStatus('봇 아이콘 업로드중...')
                            const image: Image = await uploadImage(`bot/${bot.id}/profile_image`, new Blob([zipData[innerPath]], {type: mime}), 'image_file', 'profileImageId')
                            bot.profileImageId = image.file_id;
                        } else if (mime.startsWith('image/')) {
                            setLoadingStatus(`이미지 에셋 "${name}" 업로드중...`)
                            const image: Image = await uploadImage('image', new Blob([zipData[innerPath]], {type: mime}), 'in_file')
                            imageAssets.push({
                                name: name,
                                alias: '',
                                imageId: image.file_id,
                            });
                        }
                    }
                }

                const putData = {
                    displayName: data['nickname'],
                    prompt: data['description'],
                    post_prompt: data['post_history_instructions'],
                    first_message: JSON.stringify(firstMessages),
                    image_assets: JSON.stringify(imageAssets),
                }

                await putBot(bot.id, putData)
                resolve()
            });
        } catch (err) {
            reject(err)
        }
    });
}