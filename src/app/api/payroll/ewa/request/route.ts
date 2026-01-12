import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { amount, reason } = await req.json();

        // One could re-validate available amount here for safety

        const request = await (prisma.advanceRequest as any).create({
            data: {
                userId: session.id,
                amount: parseFloat(amount),
                reason: reason || "Earned Wage Access (EWA)",
                type: 'EWA',
                status: 'PENDING'
            }
        });

        return NextResponse.json({ success: true, request });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
