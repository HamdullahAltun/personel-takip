import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ unreadMessages: 0, pendingTasks: 0 });

    const [unreadMessages, pendingTasks] = await Promise.all([
        prisma.message.count({
            where: {
                receiverId: session.id as string,
                read: false
            }
        }),
        prisma.task.count({
            where: {
                assignedToId: session.id as string,
                status: 'PENDING'
            }
        })
    ]);

    return NextResponse.json({ unreadMessages, pendingTasks });
}
