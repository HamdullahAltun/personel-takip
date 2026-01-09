import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// GET all users you have chatted with (Staff View)
export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.id as string;

    // Find unique users from sent and received messages
    const sent = await prisma.message.findMany({
        where: { senderId: userId },
        distinct: ['receiverId'],
        include: { receiver: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const received = await prisma.message.findMany({
        where: { receiverId: userId },
        distinct: ['senderId'],
        include: { sender: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // We also want ALL users to start a new chat, but maybe just list existing chats first?
    // Let's return ALL staff + admin so they can select who to chat with.
    // Actually, "Whatsapp style" usually shows recent chats, and a "New Chat" button lists contacts.

    // Let's user fetch all users for "contacts".
    const allUsers = await prisma.user.findMany({
        where: { NOT: { id: userId } },
        select: { id: true, name: true, role: true }
    });

    return NextResponse.json(allUsers);
}

// POST new message
export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, content, attachmentUrl } = await req.json();

    let sentiment = { score: 0, label: 'NEUTRAL' };
    if (content && content.length > 5) {
        // Only analyze meaningful messages
        try {
            const { analyzeSentiment } = await import('@/lib/ai');
            sentiment = await analyzeSentiment(content);
        } catch (e) {
            console.error("AI Analysis Failed", e);
        }
    }

    const message = await prisma.message.create({
        data: {
            content: content || "",
            attachmentUrl,
            senderId: session.id as string,
            receiverId,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label
        }
    });

    // Send Notification
    // Send Notification
    try {
        const senderName = (await prisma.user.findUnique({
            where: { id: session.id as string },
            select: { name: true }
        }))?.name || 'Birisi';

        const { sendPushNotification } = await import('@/lib/notifications');
        // Function signature: (userId, title, body)
        await sendPushNotification(receiverId, `Yeni Mesaj: ${senderName}`, content.substring(0, 100));
    } catch (e) {
        console.error("Notif Error:", e);
    }

    return NextResponse.json(message);
}
