import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    try {
        const task = await prisma.task.update({
            where: { id },
            data: { status }
        });

        // If completed, maybe notify admin?
        if (status === 'COMPLETED' && (session.id as string) === task.assignedToId) {
            const admin = await prisma.user.findUnique({ where: { id: task.assignedById } });
            if (admin?.fcmToken) {
                const { sendPushNotification } = await import('@/lib/notifications');
                await sendPushNotification(admin.fcmToken, "Görev Tamamlandı", `${session.id} görevi tamamladı: ${task.title}`);
            }
        }

        return NextResponse.json(task);
    } catch (e) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    try {
        await prisma.task.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
