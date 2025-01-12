export function buildAPILink(pathname: string) {
    if (typeof window !== 'undefined') {
        return `/api/${pathname}`
    }

    return `http://127.0.0.1:39831/${pathname}` //TODO: Improve this placeholder.
}

export function buildImageLink(id: string | undefined) {
    if (!id) return undefined
    return `/api/image/${id}`
}

const modifyRequestOptions = (options: RequestInit): RequestInit => {
  const currentHeaders = options.headers;
  const newHeaders = {
    ...((currentHeaders instanceof Headers)
      ? Object.fromEntries(currentHeaders.entries())
      : currentHeaders || {}), // 기존 헤더를 객체 형태로 가져오거나 빈 객체로 초기화
    'Content-Type': (currentHeaders instanceof Headers)
      ? (currentHeaders.get('Content-Type') || 'application/json')
      : (currentHeaders && 'Content-Type' in currentHeaders ? currentHeaders['Content-Type'] : 'application/json'),
  };

  return {
    ...options,
    headers: newHeaders,
  };
};

// API를 불러주는 함수, API가 발생시킨 에러 코드와 메시지를 기반으로 문제가 있으면 오류를 throwing 해주는 보조 클래스
export async function api(url: string, extra: RequestInit, autoHeaderModify = true) {
    const response = await fetch(buildAPILink(url), autoHeaderModify ? modifyRequestOptions(extra) : extra)
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