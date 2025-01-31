"use client";

import * as fflate from 'fflate';
import {dumpRoom, RawRoom} from "@/lib/data/Room";
import Bot, {getBot} from "@/lib/data/bot/Bot";
import {buildImageLink, getImage} from "@/lib/data/Image";
import ImageAsset from "@/lib/data/bot/ImageAsset";
import Persona, {getPersona} from "@/lib/data/Persona";
import Prompt, {getPrompt} from "@/lib/data/Prompt";
import {RawConversation} from "@/lib/data/Conversation";
import {api} from "@/lib/api-client";
import Summary from "@/lib/data/Summary";
import {LoreBookReadResult} from "@/lib/data/lore/ReadLoreBook";

export class Exporter {
    zip: fflate.Zip;
    exportedRooms = new Set<string>();
    exportedBots = new Set<string>();
    exportedPrompts = new Set<string>();
    exportedPersonas = new Set<string>();
    exportedImages = new Set<string>();
    exportedConversations = new Set<string>();
    exportedSummaries = new Set<string>();
    exportedLorebooks = new Set<string>();

    private zipChunks: Uint8Array[] = [];
    setStatus: (status: string) => void = () => {
    };

    constructor(setStatus: (status: string) => void) {
        this.zip = new fflate.Zip((err, dat, final) => {
            if (err) {
            } else if (dat) {
                this.zipChunks.push(dat);
                if (final) {
                    const fullZipData = this.concatenateChunks(this.zipChunks);
                    this.downloadZip(fullZipData); // 최종 Zip 다운로드
                }
            }
        });
        this.setStatus = setStatus;
    }

    private concatenateChunks(chunks: Uint8Array[]): Uint8Array {
        // 모든 Uint8Array 데이터를 하나로 합치기
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    finishAndDownload() {
        const metadata = {
            "version": 1,
            "rooms": [...this.exportedRooms],
            "bots": [...this.exportedBots],
            "prompts": [...this.exportedPrompts],
            "personas": [...this.exportedPersonas],
            "images": [...this.exportedImages],
            "conversations": [...this.exportedConversations],
            "summaries": [...this.exportedSummaries],
            "lorebooks": [...this.exportedLorebooks],
        }
        this.addFileToZip("meta.json", JSON.stringify(metadata));
        this.zip.end()
    }

    private downloadZip(data: Uint8Array) {
        const blob = new Blob([data], {type: "application/zip"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported.zip";
        a.click();
        URL.revokeObjectURL(url);
    }

    private addFileToZip(path: string, content: string | Uint8Array) {
        if (typeof content === "string") {
            const text = new fflate.ZipDeflate(path, {
                level: 9
            })
            this.zip.add(text);
            text.push(fflate.strToU8(content), true)
        } else {
            const binary = new fflate.ZipPassThrough(path)
            this.zip.add(binary);
            binary.push(content, true)
        }
    }

    private async fetchBinary(url: string): Promise<Uint8Array | null> {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch binary: ${url}`);
            return new Uint8Array(await res.arrayBuffer());
        } catch (e) {
            console.error(e);
            return null;
        }
    }

    async exportRoom(room_id: string, include_conversation: boolean) {
        if (this.exportedRooms.has(room_id)) return;

        const room: RawRoom = await dumpRoom(room_id)

        await this.exportRawRoom(room, include_conversation)
    }

    async exportRawRoom(room: RawRoom, include_conversation: boolean) {
        if (this.exportedRooms.has(room.id)) return;

        this.setStatus(`방 내보내기: ${room.name}`)
        this.addFileToZip(`rooms/${room.id}.json`, JSON.stringify(room));
        if (room.bot_id) await this.exportBot(room.bot_id);

        if (room.persona_id) await this.exportPersona(room.persona_id);

        if (room.prompt_id) await this.exportPrompt(room.prompt_id);

        if (room.summary_prompt_id) await this.exportPrompt(room.summary_prompt_id);

        if (room.re_summary_prompt_id) await this.exportPrompt(room.re_summary_prompt_id);

        if (room.translate_prompt_id) await this.exportPrompt(room.translate_prompt_id);

        if (include_conversation) {
            const conversations: RawConversation[] = await api('room/' + room.id + '/conversation/dump', {
                method: 'GET'
            })
            for (const conversation of conversations) {
                await this.exportConversation(conversation)
            }

            const summaries: Summary[] = await api('room/' + room.id + '/summary/dump', {
                method: 'GET'
            })

            for (const summary of summaries) {
                await this.exportSummary(summary)
            }
        }

        this.exportedRooms.add(room.id);
    }

    async exportBot(bot_id: string) {
        if (this.exportedBots.has(bot_id)) return;
        const bot = await getBot(bot_id)

        if (bot.lore_book_id) {
            await this.exportLoreBook(bot.lore_book_id)
        }

        await this.exportRawBot(bot)
    }

    async exportLoreBook(lore_id: string) {
        if (this.exportedLorebooks.has(lore_id)) return;
        const lore: LoreBookReadResult = await api(`lorebook/${lore_id}/read`, {
            method: 'GET'
        })

        this.setStatus(`로어북 내보내기: ${lore.book.name}`)
        this.addFileToZip(`lorebooks/${lore_id}.json`, JSON.stringify(lore));
        this.exportedLorebooks.add(lore_id);
    }

    async exportRawBot(bot: Bot) {
        this.setStatus(`봇 내보내기: ${bot.name}`)
        this.addFileToZip(`bots/${bot.id}.json`, JSON.stringify(bot));

        if (bot.profileImageId) {
            await this.exportImage(bot.profileImageId)
        }

        if (bot.image_assets) {
            const assets: ImageAsset[] = JSON.parse(bot.image_assets);
            for (const asset of assets) {
                await this.exportImage(asset.imageId)
            }
        }

        this.exportedBots.add(bot.id);
    }

    async exportPersona(persona_id: string) {
        if (this.exportedPersonas.has(persona_id)) return;

        const persona = await getPersona(persona_id)

        await this.exportRawPersona(persona)
    }

    async exportRawPersona(persona: Persona) {
        this.setStatus(`페르소나 내보내기: ${persona.name}`)

        this.addFileToZip(`personas/${persona.id}.json`, JSON.stringify(persona));
        if (persona.profileImageId) {
            await this.exportImage(persona.profileImageId)
        }
        this.exportedPersonas.add(persona.id);
    }

    async exportPrompt(prompt_id: string) {
        if (this.exportedPrompts.has(prompt_id)) return;

        const prompt = await getPrompt(prompt_id)

        await this.exportRawPrompt(prompt)
    }

    async exportRawPrompt(prompt: Prompt) {
        this.setStatus(`프롬프트 내보내기: ${prompt.name}`)

        const cloned: Prompt = {...prompt};

        if (cloned.llm_config) {
            const llmConfig = JSON.parse(cloned.llm_config);
            if (llmConfig.key) {
                llmConfig.key = "";
                cloned.llm_config = JSON.stringify(llmConfig);
            }
        }

        this.addFileToZip(`prompts/${prompt.id}.json`, JSON.stringify(cloned));
        this.exportedPrompts.add(prompt.id);
    }

    async exportImage(id: string) {
        if (this.exportedImages.has(id)) return;

        this.setStatus(`이미지 내보내기: ${id}`)

        const image = await getImage(id)
        if (!image) return;
        const binary = await this.fetchBinary(buildImageLink(id, 'original')!)
        if (!binary) return;
        this.addFileToZip(`images/${id}.bin`, binary);
        this.addFileToZip(`images/${id}.json`, JSON.stringify(image));
        this.exportedImages.add(id);
    }

    async exportConversation(conversation: RawConversation) {
        if (this.exportedConversations.has(conversation.id)) return;
        this.setStatus(`대화 내보내기: ${conversation.id}`)
        this.addFileToZip(`conversations/${conversation.id}.json`, JSON.stringify(conversation));
        this.exportedConversations.add(conversation.id);
    }

    async exportSummary(summary: Summary) {
        if (this.exportedSummaries.has(summary.id)) return;
        this.setStatus(`요약 내보내기: ${summary.id}`)
        this.addFileToZip(`summaries/${summary.id}.json`, JSON.stringify(summary));
        this.exportedSummaries.add(summary.id);
    }
}