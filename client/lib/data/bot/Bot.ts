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
import {createChapter} from "@/lib/data/lore/LoreChapter";
import {createLore, updateLore} from "@/lib/data/lore/Lore";
import {getLoreBook} from "@/lib/data/lore/LoreBook";
import {extractPngTextChunks} from "@/lib/png";

export default interface Bot extends Persona, BaseData, ProfileImage {
    post_prompt: string | undefined
    first_message: string | undefined
    image_assets: string | undefined
    lore_book_id: string | undefined
}

type PartialBot = Partial<Bot>;

export async function getBots(offset: number = 0, limit: number = 100): Promise<Bot[]> {
    return await api(`bot?offset=${offset}&limit=${limit}`, {
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

export async function createLoreBookForBot(id: string): Promise<Bot> {
    return await api(`bot/${id}/lorebook`, {
        method: 'POST'
    })
}

export async function deleteBot(id: string): Promise<void> {
    return await api(`bot/${id}`, {
        method: 'DELETE'
    })
}

interface CardV3LoreBookEntry {
    keys: string[],
    content: string,
    enabled: boolean,
    insertion_order: number,
    constant: boolean,
    selective: boolean,
    name: string,
    comment: string,
}

export async function importBotFromFile(mime: string, arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void): Promise<string | undefined> {
    if (mime.startsWith('application/zip')) {
        return await importBotFromZip(arrayBuffer, setLoadingStatus)
    }
    if (mime.startsWith('image/')) {
        return await importBotFromPng(arrayBuffer, setLoadingStatus)
    }
    throw new Error("Invalid file type")
}

async function processCardJson(card: any, loadAsset: (uri: string) => Uint8Array | undefined, setLoadingStatus: (status: string) => void) {
    const data = card['data'];

    setLoadingStatus("봇 카드 등록하는중...");
    let bot = await createBot(data['name'])

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
            const mtype = new MimeType(mimedb)
            const mockFileName = 'data.' + ext
            const mime: string = mtype.lookup(mockFileName);
            if (!mime) {
                console.error(`MIME type for file "${name}"(${mockFileName}) not found`);
                continue;
            }

            const fileData = loadAsset(uri);
            if (!fileData) {
                console.error(`Asset data for "${uri}" not found`);
                continue;
            }

            if (type === "icon") {
                setLoadingStatus('봇 아이콘 업로드중...')
                const image: Image = await uploadImage(`bot/${bot.id}/profile_image`, new Blob([fileData], {type: mime}), 'image_file', 'profileImageId')
                bot.profileImageId = image.file_id;
            } else if (mime.startsWith('image/')) {
                setLoadingStatus(`이미지 에셋 "${name}" 업로드중...`)
                const image: Image = await uploadImage('image', new Blob([fileData], {type: mime}), 'in_file')
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

    bot = await putBot(bot.id, putData)

    const lores: CardV3LoreBookEntry[] = data?.character_book?.entries || undefined;
    if (lores) {
        bot = await createLoreBookForBot(bot.id);
        setLoadingStatus(`로어북 초기화중...`)
        const loreBook = await getLoreBook(bot.lore_book_id!)
        const chapter = await createChapter(loreBook, '가져온 로어')
        for (const lore of lores) {
            const keyword = lore.keys.join(', ')
            const yumeLore = await createLore(loreBook, chapter, lore.name)
            setLoadingStatus(`로어 "${lore.name}" 가져오는중...`)
            // TODO: 아니 왜 로어만 설명 없냐
            await updateLore(loreBook, chapter, yumeLore.id, {
                order: yumeLore.order,
                always: lore.constant,
                content: lore.content,
                keyword: keyword,
            })
        }
    }

    if (data?.extensions?.risuai?.license) {
        return `대상 파일이 라이센스 정보를 포함하고 있습니다, 준수해주세요: ${data?.extensions?.risuai?.license}`
    }

    return undefined
}

async function importBotFromPng(arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) {
    const chunks = await extractPngTextChunks(arrayBuffer)
    console.log(chunks)

    function findChunk(keyword: string) {
        return chunks.find(chunk => chunk.keyword === keyword);
    }

    const card = findChunk('ccv3')
    if (!card) {
        throw new Error("Invalid card? or character v2")
    }

    let cardJson: any
    try {
        cardJson = JSON.parse(Buffer.from(card.text, 'base64').toString('utf8'))
    } catch {
        cardJson = JSON.parse(card.text)
    }

    console.log(cardJson)

    function loadAsset(uri: string) {
        if (uri.startsWith('ccdefault')) {
            return new Uint8Array(arrayBuffer);
        }
        //in chunk: chara-ext-asset_:0

        //uri: __asset:0
        if (!uri.startsWith('__asset:')) {
            return undefined;
        }
        const innerPath = uri.replace('__asset:', '');
        const chunk = findChunk(`chara-ext-asset_:${innerPath}`)
        if (!chunk) return undefined;
        const buffer = Buffer.from(chunk.text, 'base64')
        return buffer as unknown as Uint8Array;
    }

    return await processCardJson(cardJson, loadAsset, setLoadingStatus)
}

async function importBotFromZip(arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) {
    return new Promise<string | undefined>((resolve, reject) => {
        // fflate.unzipSync 대신 비동기 unzip 사용 (더 큰 파일에 적합)
        fflate.unzip(new Uint8Array(arrayBuffer), async (err, zipData) => {
            let result: string | undefined = undefined;
            try {
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

                function loadAsset(uri: string) {
                    if (!uri.startsWith('embeded://')) {
                        return undefined;
                    }

                    // Extract path from the URI
                    const innerPath = uri.replace('embeded://', '');
                    return zipData[innerPath];
                }

                result = await processCardJson(card, loadAsset, setLoadingStatus)
            } catch (err) {
                reject(err)
            }

            resolve(result)
        });
    });
}