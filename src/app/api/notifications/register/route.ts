import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

        const cookieStore = await cookies();
        const authToken = cookieStore.get('personel_token')?.value;
        if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(authToken);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.user.update({
            where: { id: payload.id as string },
            data: { fcmToken: token }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
    }
}
