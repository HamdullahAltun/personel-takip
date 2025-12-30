import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const pendingLeaves = await prisma.leaveRequest.findMany({
            where: { status: "PENDING" },
            include: { user: true },
            orderBy: { createdAt: "desc" }
        });

        const pastLeaves = await prisma.leaveRequest.findMany({
            where: { status: { not: "PENDING" } },
            include: { user: true },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return NextResponse.json({ pendingLeaves, pastLeaves });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status, rejectionReason } = body;

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null
            }
        });

        if (updated.userId) {
            const { sendPushNotification } = await import('@/lib/notifications');
            const title = status === 'APPROVED' ? "İzin Onaylandı" : "İzin Reddedildi";
            const bodyText = status === 'APPROVED'
                ? "İzin talebiniz onaylanmıştır."
                : `İzin talebiniz reddedildi. Sebep: ${rejectionReason}`;
            await sendPushNotification(updated.userId, title, bodyText);
        }

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
