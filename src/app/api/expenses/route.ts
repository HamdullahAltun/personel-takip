import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        let where: any = {};
        if (session.role !== 'ADMIN') {
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
                receiptImage, // Optional base64
                userId: session.id as string
            }
        });

        // Notify Admins? For now, no specific notification unless requested.

        return NextResponse.json(expense);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
}
