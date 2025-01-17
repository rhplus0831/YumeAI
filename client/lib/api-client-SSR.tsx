"use server";

import { cookies } from 'next/headers'

export async function getCookie() {
    return await cookies()
}