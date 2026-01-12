import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { shiftId, isOpen, bonusPoints } = await req.json();

        const updated = await (prisma.shift as any).update({
            where: { id: shiftId },
            data: {
                isBiddingOpen: isOpen,
                bonusPoints: bonusPoints || 0
            }
        });

        return NextResponse.json({ success: true, updated });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
