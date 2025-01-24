import {getCookie} from "./api-client-SSR";

export function buildAPILink(pathname: string) {
    if (typeof window !== 'undefined') {
        return `/api/${pathname}`
    }

    return `http://127.0.0.1:39831/${pathname}` //TODO: Improve this placeholder.
}

export function buildImageLink(id: string | undefined, size: string = "original") {
    if (!id) return undefined
    return `/api/image/${id}/${size}`
}

const modifyRequestOptions = async (options: RequestInit): Promise<RequestInit> => {
    let currentHeaders = options.headers;

    let cookieString: string | undefined = '';

    if (typeof window === 'undefined') {
        const serverCookies = await getCookie();
        cookieString = serverCookies.toString();
    }

    if (currentHeaders instanceof Headers) {
        if (!currentHeaders.get('Content-Type')) {
            currentHeaders.set('Content-Type', 'application/json')
        }
        if (cookieString) {
            currentHeaders.set('Cookie', cookieString)
        }
    } else {
        currentHeaders = {
            'Content-Type': 'application/json',
            'Cookie': cookieString || ''
        }
    }

    return {
        ...options,
        headers: currentHeaders,
    };
};

// API를 불러주는 함수, API가 발생시킨 에러 코드와 메시지를 기반으로 문제가 있으면 오류를 throwing 해주는 보조 클래스
export async function api(url: string, extra: RequestInit, autoHeaderModify = true) {
    const response = await fetch(buildAPILink(url), autoHeaderModify ? await modifyRequestOptions(extra) : extra)
    const data = await response.json()
    if (!response.ok) {
        if (typeof (data.detail) !== "string") {
            throw new Error(data.detail[0].msg)
        } else {
            throw new Error(data.detail)
        }
    }
    return data
}

export async function verifySelf() {
    return await api('verify-self', {
        method: 'GET'
    })
}

export async function login(id: string, password: string) {
    await api('login', {
        method: 'POST',
        body: JSON.stringify({
            username: id,
            password: password
        })
    })
}

export async function register(id: string, password: string) {
    await api('register', {
        method: 'POST',
        body: JSON.stringify({
            username: id,
            password: password
        })
    })
}