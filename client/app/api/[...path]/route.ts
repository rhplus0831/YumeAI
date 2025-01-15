import { NextRequest, NextResponse } from 'next/server';
import {buildAPILink} from "@/lib/api-client";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
    const params = await props.params;
    return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
    const path = params.path.join('/'); // 경로를 만들어냄 (ex: /api/example/test => example/test)
    const targetURL = buildAPILink(path); // 백엔드 서버로 포워드할 URL
    const fetchOptions: RequestInit = {
        method: req.method || 'GET', // 요청 메서드 그대로 사용
        headers: {
            // 헤더 복사 및 필요한 경우 수정
            ...Object.fromEntries(req.headers),
        },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : undefined,
        // GET이나 HEAD 요청은 body를 포함하지 않음
    };

    try {
        // 백엔드 서버로 요청 전송
        const backendResponse = await fetch(targetURL, fetchOptions);

        // 스트리밍 데이터를 클라이언트로 전달
        return new NextResponse(backendResponse.body, {
            status: backendResponse.status,
            headers: backendResponse.headers, // 백엔드 헤더를 그대로 전달
        });
    } catch (error) {
        console.error('Streaming error:', error);
        return NextResponse.json({ error: 'Streaming failed' }, { status: 500 });
    }
}