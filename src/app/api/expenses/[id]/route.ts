import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    try {
        const existingconfig = await prisma.expense.findUnique({ where: { id } });
        if (!existingconfig) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Logic split
        if (session.role === 'ADMIN') {
            // Admin can update everything
            const expense = await prisma.expense.update({
                where: { id },
                data: { ...body }, // Be careful with this spread in production, but okay for now
                include: { user: true }
            });

            // If status changed to approved/rejected, notify
            if (body.status && body.status !== existingconfig.status) {
                // sendPushNotification takes userId, looks up token internally
                const { sendPushNotification } = await import('@/lib/notifications');
                const title = body.status === 'APPROVED' ? "Harcama Onaylandı" : "Harcama Reddedildi";
                const notifBody = body.status === 'APPROVED'
                    ? `${expense.amount}₺ tutarındaki harcamanız onaylandı.`
                    : `${expense.amount}₺ tutarındaki harcamanız reddedildi. Sebep: ${body.rejectionReason}`;

                await sendPushNotification(expense.userId, title, notifBody);
            }
            return NextResponse.json(expense);

        } else {
            // Staff can only update if PENDING and only ownership
            if (existingconfig.userId !== (session.id as string)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            if (existingconfig.status !== 'PENDING') {
                return NextResponse.json({ error: "Cannot edit processed expense" }, { status: 400 });
            }

            // Allowed fields
            const { description, amount, date, category } = body;
            const expense = await prisma.expense.update({
                where: { id },
                data: { description, amount, date, category }
            });
            return NextResponse.json(expense);
        }

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Only owner (if pending) or Admin can delete
        if (session.role !== 'ADMIN' && expense.userId !== (session.id as string)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // If staff, can only delete PENDING
        if (session.role !== 'ADMIN' && expense.status !== 'PENDING') {
            return NextResponse.json({ error: "Cannot delete processed expense" }, { status: 400 });
        }

        await prisma.expense.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
