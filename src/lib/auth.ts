import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-this-in-prod');

export interface AppJWTPayload {
    id: string;
    role: string;
    name?: string;
    [key: string]: unknown;
}

export async function signJWT(payload: any, expiresIn: string | number = '7d') {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET_KEY);
}

import { cookies } from 'next/headers';

export async function verifyJWT(token: string): Promise<AppJWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as AppJWTPayload;
    } catch {
        return null;
    }
}

export async function getAuth(): Promise<AppJWTPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('personel_token')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);

    if (payload && payload.id) {
        try {
            // Check DB to ensure user still exists and get latest role
            // Dynamic import to avoid breaking Middleware (Edge Runtime)
            const { prisma } = await import('@/lib/prisma');
            const user = await prisma.user.findUnique({
                where: { id: payload.id as string },
                select: { id: true, role: true }
            });

            if (!user) return null; // User deleted
            return { ...payload, role: user.role };
        } catch (e) {
            // Fallback for non-DB environments or errors
            // Trust valid signature if DB check fails to avoid blocking valid users during glitches
            console.error("Auth check internal error (falling back to token):", e);
            return payload;
        }
    }

    return payload;
}
