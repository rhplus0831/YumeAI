// 순도 90% 제미나이 산 코드
// TODO: 성능 개선점 혹은 문제점 있나 확인하기

export interface ParsedPng {
    leftover: Uint8Array;
    textChunks: TextChunk[];
}

export interface TextChunk {
    keyword: string;
    text: string;
}

export async function extractPngChunks(arrayBuffer: ArrayBuffer): Promise<ParsedPng> {
    const byteArray = new Uint8Array(arrayBuffer);
    if (!isPng(byteArray)) {
        throw new Error('Not a PNG file');
    }

    const textChunks: TextChunk[] = [];
    let leftoverChunks: Uint8Array[] = [];
    leftoverChunks.push(byteArray.subarray(0, 8))
    let offset = 8; // PNG 시그니처 이후부터 시작

    while (offset < byteArray.length) {
        const length = readUint32(byteArray, offset);
        offset += 4;
        const chunkType = readString(byteArray, offset, 4);
        offset += 4;
        const chunkData = byteArray.subarray(offset, offset + length);
        offset += length;
        const crc = byteArray.subarray(offset, offset + 4);
        offset += 4; // CRC

        if (chunkType === 'tEXt') {
            textChunks.push(processTextChunk(chunkData));
        } else {
            const fullChunk = new Uint8Array(8 + length + 4); // length(4) + type(4) + data + crc(4)
            fullChunk.set(new Uint8Array([length >>> 24, length >>> 16 & 0xff, length >>> 8 & 0xff, length & 0xff]), 0); // length
            fullChunk.set(new TextEncoder().encode(chunkType), 4); // chunkType
            fullChunk.set(chunkData, 8); // chunkData
            fullChunk.set(crc, 8 + length); // crc
            leftoverChunks.push(fullChunk);
        }

        if (chunkType === 'IEND') { // IEND chunk를 만나면 종료 (선택 사항)
            break;
        }
    }

    const leftover = leftoverChunks.length > 0
        ? mergeUint8Arrays(leftoverChunks)
        : new Uint8Array();

    return {
        leftover: leftover,
        textChunks: textChunks
    };
}

// Uint8Array 배열을 하나의 Uint8Array로 병합하는 유틸리티 함수
function mergeUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, array) => acc + array.length, 0);
    const mergedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (const array of arrays) {
        mergedArray.set(array, offset);
        offset += array.length;
    }
    return mergedArray;
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
