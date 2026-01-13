import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

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
        logError("Fetch Leaves API Error", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, rejectionReason } = body;

        const currentLeave = await prisma.leaveRequest.findUnique({ where: { id } });
        if (!currentLeave) return NextResponse.json({ error: "Leave not found" }, { status: 404 });
        if (currentLeave.status === status) return NextResponse.json({ success: true });

        const { adjustLeaveBudget } = await import('@/lib/leave-utils');

        // Handle Annual Leave Days Budget
        if (status === "APPROVED" && currentLeave.status !== "APPROVED") {
            await adjustLeaveBudget(currentLeave.userId, currentLeave.startDate, currentLeave.endDate, 'DEDUCT');
        }

        if (status === "REJECTED" && currentLeave.status === "APPROVED") {
            await adjustLeaveBudget(currentLeave.userId, currentLeave.startDate, currentLeave.endDate, 'REFUND');
        }

        const updated = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null
            }
        });

        logInfo(`Leave status updated via API to ${status} by ${session.id}`, { leaveId: id });

        if (updated.userId) {
            const { createNotification } = await import('@/lib/notifications');
            const title = status === 'APPROVED' ? "İzin Onaylandı ✅" : "İzin Reddedildi ❌";
            const bodyText = status === 'APPROVED'
                ? "İzin talebiniz onaylanmıştır."
                : `İzin talebiniz reddedildi. Sebep: ${rejectionReason}`;
            const type = status === 'APPROVED' ? 'SUCCESS' : 'ERROR';

            await createNotification(updated.userId, title, bodyText, type);
        }

        return NextResponse.json(updated);
    } catch (e) {
        logError("Update Leave API Error", e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
