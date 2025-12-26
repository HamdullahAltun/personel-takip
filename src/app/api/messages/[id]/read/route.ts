import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // senderId (the other person)
        const cookieStore = await cookies();
        const token = cookieStore.get('personel_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const myId = payload.id as string;

        // Mark all messages from 'id' to 'myId' as read
        await prisma.message.updateMany({
            where: {
                senderId: id,
                receiverId: myId,
                read: false
            },
            data: {
                read: true
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
