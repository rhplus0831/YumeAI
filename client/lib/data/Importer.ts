import * as fflate from "fflate";
import Image, {uploadImage} from "@/lib/data/Image";
import {api} from "@/lib/api-client";

interface MetaData {
    rooms: string[];
    bots: string[];
    personas: string[];
    prompts: string[];
    images: string[];
    conversations: string[];
    summaries: string[];
}


export async function importDataFromZip(mime: string, arrayBuffer: ArrayBuffer, setLoadingStatus: (status: string) => void) {
    return new Promise<undefined>((resolve, reject) => {
        try {
            // fflate.unzipSync 대신 비동기 unzip 사용 (더 큰 파일에 적합)
            fflate.unzip(new Uint8Array(arrayBuffer), async (err, zipData) => {
                if (err || !zipData) {
                    throw new Error(`Error unzipping file: ${err?.message}`);
                }
                if (!zipData['meta.json']) {
                    throw new Error("Invalid file - 'meta.json' not found");
                }

                const meta: MetaData = JSON.parse(new TextDecoder().decode(zipData["meta.json"]));

                async function loadTable(tableName: keyof MetaData, autoEndpoint?: string, handleData?: (data: any) => Promise<void>) {
                    const tableData = meta[tableName];
                    if (handleData) {
                        for (const dataId of tableData) {
                            setLoadingStatus(`${tableName} 가져오는중... ${dataId}`);
                            const jsonData = JSON.parse(
                                new TextDecoder().decode(zipData[`${tableName}/${dataId}.json`])
                            );

                            if (handleData) {
                                await handleData(jsonData);
                            }
                        }
                    } else if (autoEndpoint) {
                        const jsonData = meta[tableName].map((dataId) => JSON.parse(new TextDecoder().decode(zipData[`${tableName}/${dataId}.json`])))
                        for (let i = 0; i < jsonData.length; i += 50) {
                            setLoadingStatus(`${tableName} 가져오는중... ${i} / ${jsonData.length}`);
                            await api(autoEndpoint, {
                                method: "POST",
                                body: JSON.stringify({
                                    'datas': jsonData.slice(i, i + 50)
                                }),
                            })
                        }
                    } else {
                        throw new Error("provide autoEndpoint or handleData");
                    }
                }

                await loadTable("prompts", 'prompt/restore')
                await loadTable("bots", 'bot/restore')
                await loadTable("personas", 'persona/restore')
                await loadTable("rooms", 'room/restore');
                await loadTable("conversations", 'conversation/restore')
                await loadTable("summaries", 'summary/restore')
                await loadTable("images", undefined, async (data: Image) => {
                    await uploadImage(`image/${data.file_id}`, new Blob([zipData[`images/${data.file_id}.bin`]], {type: data.file_type}), 'in_file')
                })

                resolve(undefined)
            });
        } catch (err) {
            reject(err)
        }
    });
}