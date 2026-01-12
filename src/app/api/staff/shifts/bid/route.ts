import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { shiftId } = await req.json();

        const shift = await prisma.shift.findUnique({
            where: { id: shiftId }
        }) as any;

        if (!shift || !shift.isBiddingOpen) {
            return NextResponse.json({ error: "Bu vardiya ihalesi kapalı." }, { status: 400 });
        }

        // Logic: First come, first served for bidding (or could be manual choice)
        // Here we'll make it "Instantly Claim" if it's an open bid

        await (prisma.shift as any).update({
            where: { id: shiftId },
            data: {
                userId: session.id, // Re-assign to bidder
                isBiddingOpen: false,
                bidWinnerId: session.id,
                status: 'PUBLISHED'
            }
        });

        // Award bonus points if any
        if (shift.bonusPoints > 0) {
            await prisma.user.update({
                where: { id: session.id },
                data: { points: { increment: shift.bonusPoints } }
            });
        }

        return NextResponse.json({ success: true, message: "Vardiyayı başarıyla aldınız!" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
