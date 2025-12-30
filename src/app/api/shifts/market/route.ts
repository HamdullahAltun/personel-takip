import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    // List open shift trades
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const openTrades = await prisma.shiftTrade.findMany({
            where: {
                status: 'OPEN',
                shift: {
                    start: { gte: new Date() } // Only future trades
                }
            },
            include: {
                shift: true,
                requester: { select: { name: true, profilePicture: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(openTrades);
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
