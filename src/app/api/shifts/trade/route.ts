import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    // Create new trade Request
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { shiftId } = await req.json();

        // Verify ownership
        const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
        if (!shift || shift.userId !== session.id) {
            return NextResponse.json({ error: 'Bu vardiya size ait değil veya bulunamadı.' }, { status: 403 });
        }

        // Check if already posted
        const existing = await prisma.shiftTrade.findFirst({
            where: { shiftId, status: { in: ['OPEN', 'PENDING'] } }
        });

        if (existing) return NextResponse.json({ error: 'Bu vardiya zaten takasta.' }, { status: 400 });

        const trade = await prisma.shiftTrade.create({
            data: {
                shiftId,
                requesterId: session.id as string,
                status: 'OPEN'
            }
        });

        return NextResponse.json(trade);

    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // Take/Accept a trade
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { tradeId } = await req.json();

        const trade = await prisma.shiftTrade.findUnique({
            where: { id: tradeId },
            include: { shift: true }
        });

        if (!trade || trade.status !== 'OPEN') {
            return NextResponse.json({ error: 'Takas bulunamadı veya artık geçerli değil.' }, { status: 400 });
        }

        if (trade.requesterId === session.id) {
            return NextResponse.json({ error: 'Kendi vardiyanızı alamazsınız.' }, { status: 400 });
        }

        // Assign recipient and mark as PENDING (waiting mapager or auto approved?)
        // Let's assume auto-approve for simplicity OR 'ACCEPTED' needing manager approval.
        // The user asked for "Tek tıkla onaya gitsin". So status becomes APPROVED if we auto swap, or PENDING if manager manual.
        // Let's implement immediate swaop for MVP demo or PENDING.
        // Ideally: Status -> 'ACCEPTED' (by peer) -> Manager sees it -> Manager Approves -> Shift userId updates.

        // For now, let's make it direct swap to show functionality instantly? No, safer is Manager Approval.
        // Update trade to ACCEPTED with recipient.

        await prisma.shiftTrade.update({
            where: { id: tradeId },
            data: {
                recipientId: session.id as string,
                status: 'ACCEPTED' // Needs Manager Approval
            }
        });

        // Notify manager logic here (omitted for brevity)

        return NextResponse.json({ success: true, message: 'Takas talebi kabul edildi. Yönetici onayı bekleniyor.' });

    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
