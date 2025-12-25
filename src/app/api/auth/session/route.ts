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
        const { phone_number } = decodedToken;

        if (!phone_number) {
            return NextResponse.json({ error: 'Phone number not found in token' }, { status: 400 });
        }

        let searchPhone = phone_number.replace('+90', '');
        if (searchPhone.startsWith('0')) searchPhone = searchPhone.substring(1);

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: phone_number }, // +90...
                    { phone: searchPhone },  // 555...
                    { phone: '0' + searchPhone } // 0555...
                ]
            }
        });

        if (!user) {
            const userCount = await prisma.user.count();
            const role = userCount === 0 ? 'ADMIN' : 'STAFF';

            user = await prisma.user.create({
                data: {
                    phone: phone_number,
                    name: 'New User',
                    role
                }
            });
        }

        const token = await signJWT({ id: user.id, role: user.role });

        (await cookies()).set('personel_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json({ success: true, user });

    } catch (error) {
        console.error('Session Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
