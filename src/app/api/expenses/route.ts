import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { sendPushNotification } from '@/lib/notifications';
import { logInfo, logError } from '@/lib/log-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        let where: any = {};
        if (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE') {
            where = { userId: session.id };
        }

        const expenses = await prisma.expense.findMany({
            where,
            include: {
                user: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(expenses);
    } catch (e) {
        logError("Expense fetch error", e);
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { description, amount, date, category, receiptImage } = body;

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                category,
                receiptImage,
                userId: session.id
            }
        });

        logInfo(`New expense submitted by user ${session.id}`, { amount, category });
        return NextResponse.json(expense);
    } catch (e) {
        logError("Expense creation failed", e);
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
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

        const updated = await prisma.expense.update({
            where: { id },
            data: {
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null
            }
        });

        logInfo(`Expense ${id} status updated to ${status} by ${session.id}`);

        // Send Notification
        if (updated.userId) {
            const title = status === 'APPROVED' ? 'Harcama Onaylandı' : 'Harcama Reddedildi';
            const bodyTxt = status === 'APPROVED'
                ? `Harcama talebiniz onaylandı: ${updated.description}`
                : `Harcama talebiniz reddedildi. Sebep: ${rejectionReason}`;

            await sendPushNotification(updated.userId, title, bodyTxt).catch(e => logError("Push failed", e));
        }

        return NextResponse.json(updated);
    } catch (e) {
        logError("Expense update failed", e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
