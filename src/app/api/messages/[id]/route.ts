import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: otherUserId } = await params;
    const myId = session.id as string;

    // Mark as read (only messages sent BY other User TO me)
    await prisma.message.updateMany({
        where: {
            senderId: otherUserId,
            receiverId: myId,
            read: false
        },
        data: { read: true }
    });

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
}
