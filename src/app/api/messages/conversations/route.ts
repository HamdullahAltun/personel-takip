import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.id as string;

    // Get all messages involved
    const messages = await prisma.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            sender: { select: { id: true, name: true, role: true } },
            receiver: { select: { id: true, name: true, role: true } }
        }
    });

    // Group by conversation partner
    const conversations = new Map();

    for (const msg of messages) {
        const isMyMsg = msg.senderId === userId;
        const partner = isMyMsg ? msg.receiver : msg.sender;
        const partnerId = partner.id;

        if (!conversations.has(partnerId)) {
            conversations.set(partnerId, {
                user: partner,
                lastMessage: msg,
                unreadCount: 0
            });
        }

        // Count unread: If I am the receiver AND it is not read
        if (!isMyMsg && !msg.read) {
            conversations.get(partnerId).unreadCount++;
        }
    }

    return NextResponse.json(Array.from(conversations.values()));
}
