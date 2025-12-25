import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-this-in-prod');

export async function signJWT(payload: any, expiresIn: string | number = '7d') {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET_KEY);
}

import { cookies } from 'next/headers';

export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getAuth() {
    const cookieStore = await cookies();
    const token = cookieStore.get('personel_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
}
