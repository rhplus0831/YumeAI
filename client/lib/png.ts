// 순도 90% 제미나이 산 코드
// TODO: 성능 개선점 혹은 문제점 있나 확인하기

export interface TextChunk {
    keyword: string;
    text: string;
}

export async function extractPngTextChunks(arrayBuffer: ArrayBuffer): Promise<TextChunk[]> {
    const byteArray = new Uint8Array(arrayBuffer);
    if (!isPng(byteArray)) {
        throw new Error('Not a PNG file');
    }

    const textChunks: TextChunk[] = [];
    let offset = 8; // PNG 시그니처 이후부터 시작

    while (offset < byteArray.length) {
        const length = readUint32(byteArray, offset);
        offset += 4;
        const chunkType = readString(byteArray, offset, 4);
        offset += 4;
        const chunkData = byteArray.subarray(offset, offset + length);
        offset += length;
        offset += 4; // CRC (무시)

        if (chunkType === 'tEXt') {
            textChunks.push(processTextChunk(chunkData));
        }

        if (chunkType === 'IEND') { // IEND chunk를 만나면 종료 (선택 사항)
            break;
        }
    }
    return textChunks;
}

function isPng(byteArray: Uint8Array): boolean {
    // PNG 시그니처 확인: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < pngSignature.length; i++) {
        if (byteArray[i] !== pngSignature[i]) {
            return false;
        }
    }
    return true;
}

function readUint32(byteArray: Uint8Array, offset: number): number {
    return (
        (byteArray[offset] << 24) |
        (byteArray[offset + 1] << 16) |
        (byteArray[offset + 2] << 8) |
        byteArray[offset + 3]
    );
}

function readString(byteArray: Uint8Array, offset: number, length: number): string {
    const decoder = new TextDecoder(); // UTF-8 디코더
    return decoder.decode(byteArray.subarray(offset, offset + length));
}

function processTextChunk(chunkData: Uint8Array): TextChunk {
    // tEXt chunk 처리: 키워드 (null terminated) + 텍스트
    let keyword = "";
    let text = "";
    let i = 0;
    while (i < chunkData.length && chunkData[i] !== 0) {
        keyword += String.fromCharCode(chunkData[i]);
        i++;
    }
    text = readString(chunkData, i + 1, chunkData.length - (i + 1)); // null 문자 다음부터 텍스트
    return {
        keyword: keyword,
        text: text,
    }
}
