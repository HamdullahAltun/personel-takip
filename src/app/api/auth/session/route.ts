import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getFirebaseAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
        }

        // Verify Firebase Token
        const auth = await getFirebaseAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        const { phone_number, email } = decodedToken;

        if (!phone_number && !email) {
            return NextResponse.json({ error: 'Identity/Phone/Email not found in token' }, { status: 400 });
        }

        let user = null;

        // Try to find by phone
        if (phone_number) {
            let searchPhone = phone_number.replace('+90', '');
            if (searchPhone.startsWith('0')) searchPhone = searchPhone.substring(1);

            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { phone: phone_number }, // +90...
                        { phone: searchPhone },  // 555...
                        { phone: '0' + searchPhone } // 0555...
                    ]
                }
            });
        }

        // Try to find by email if not found by phone
        if (!user && email) {
            user = await prisma.user.findFirst({
                where: { email }
            });
        }

        if (!user) {
            const userCount = await prisma.user.count();

            // Only create if it's the very first user (ADMIN)
            if (userCount === 0) {
                user = await prisma.user.create({
                    data: {
                        phone: phone_number || '',
                        email: email || null,
                        name: 'Admin User',
                        role: 'ADMIN'
                    }
                });
            } else {
                return NextResponse.json({ error: 'Kayıtlı kullanıcı bulunamadı. Yönetici ile iletişime geçin.' }, { status: 401 });
            }
        }

        const token = await signJWT({ id: user.id, role: user.role });

        (await cookies()).set('personel_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        const { logInfo } = await import('@/lib/log-utils');
        logInfo(`User logged in: ${user.name} (${user.role})`, { userId: user.id });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        const { logError } = await import('@/lib/log-utils');
        logError('Session Error', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
