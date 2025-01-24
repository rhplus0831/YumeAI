const IMAGE_CACHE_NAME = 'decrypted-image-cache';

const DB_NAME = 'yumeDatabase';
const DB_VERSION = 1; // 스키마 변경 시 버전 업데이트
const OBJECT_STORE_NAME = 'configs';
const STRING_KEY = 'assetKey';

async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = event => {
            console.error('IndexedDB 열기 실패:', event.target.errorCode);
            reject(event.target.errorCode);
        };

        request.onsuccess = event => {
            const db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                db.createObjectStore(OBJECT_STORE_NAME);
                console.log('Object Store 생성:', OBJECT_STORE_NAME);
            }
        };
    });
}

async function getStringFromDB() {
    const db = await initializeDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
        const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
        const getRequest = objectStore.get(STRING_KEY);

        getRequest.onsuccess = event => {
            resolve(event.target.result);
        };

        getRequest.onerror = event => {
            reject(event.target.errorCode);
        };

        transaction.oncomplete = () => {
            db.close();
        };
        transaction.onerror = () => {
            db.close();
        };
    });
}

async function setStringToDB(string) {
    const db = await initializeDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const objectStore = transaction.objectStore(OBJECT_STORE_NAME);
        const putRequest = objectStore.put(string, STRING_KEY);

        putRequest.onsuccess = event => {
            resolve();
        };

        putRequest.onerror = event => {
            reject(event.target.errorCode);
        };

        transaction.oncomplete = () => {
            db.close();
        };
        transaction.onerror = () => {
            db.close();
        };
    });
}

async function imageGetter(event) {
    let request = event.request;
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    const key = await getStringFromDB();

    if (key) {
        const variant = request.url.slice(request.url.lastIndexOf('/') + 1);
        if (variant !== "original") {
            //일단 오리지널 위치로 강제이동
            return Response.redirect(request.url.slice(0, request.url.lastIndexOf('/')) + "/original")
        }
    }

    let response = await fetch(request, {
        redirect: 'manual',
        caching: 'no-store'
    });

    console.log(response)

    let mimeType = '';

    if (response.status === 204) {
        mimeType = response.headers.get('x-content-type');
        const url = response.headers.get('x-data-location');
        //x-data-location MUST allow cors for yumeai
        response = await fetch(url, {
            redirect: 'follow',
            caching: 'no-store'
        });
    } else {
        mimeType = response.headers.get('Content-Type');
    }

    if (response.status !== 200) {
        return response;
    }

    const blob = await response.blob();
    const encryptedArrayBuffer = await blob.arrayBuffer();

    if (!key) {
        response = new Response(arrayBuffer, {})
        event.waitUntil(cache.put(request, response.clone()));
        return response;
    }

    const ivLength = 16; // IV 길이 (bytes)
    const extractedIV = new Uint8Array(encryptedArrayBuffer, 0, ivLength); // ArrayBuffer에서 IV 부분 추출
    const encryptedDataWithoutIV = new Uint8Array(encryptedArrayBuffer, ivLength); // ArrayBuffer에서 암호화된 데이터 부분 추출

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(key).slice(0, 32),
        {name: "AES-GCM", length: 256}, // 키 알고리즘 및 길이 설정
        false, // exportable 여부
        ["decrypt"] // 사용 용도
    );

    const decryptedData = await crypto.subtle.decrypt(
        {name: "AES-GCM", iv: extractedIV},
        cryptoKey,
        encryptedDataWithoutIV
    );

    response = new Response(decryptedData, {
        headers: {
            "Content-Type": mimeType
        }
    });

    event.waitUntil(cache.put(event.request, new Response(decryptedData, { // event.request 사용
        headers: {
            "Content-Type": mimeType
        }
    })).catch(error => {
        console.error("Cache put error:", error); // 오류 처리 추가
    }));
    return response;
}

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 요청 경로가 /api/image 로 시작하는 경우에만 처리
    if (url.pathname.startsWith('/api/image')) {
        event.respondWith(imageGetter(event));
    }
});

async function handleMessage(event) {
    if (event.data.type === 'assetKey') {
        try {
            await setStringToDB(event.data.payload);
            console.log('저장 성공!');
        } catch (error) {
            console.error('저장 실패:', error);
        }
    }
}

self.addEventListener('message', handleMessage);