import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest): NextResponse {
    // 특정 쿠키 확인
    // 쿠키가 없는 경우 '/login'으로 리다이렉트
    if (!request.cookies.has('auth_token') && request.nextUrl.pathname !== "/login") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (request.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/rooms", request.url));
    }

    // 쿠키가 있으면 요청을 그대로 통과
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};