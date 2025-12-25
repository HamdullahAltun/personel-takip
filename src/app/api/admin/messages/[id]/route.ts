import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch User with Messages
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                sentMessages: { include: { receiver: { select: { name: true } } } },
                receivedMessages: { include: { sender: { select: { name: true } } } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Combine and sort
        const messages = [...user.sentMessages, ...user.receivedMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return NextResponse.json(messages);

    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
