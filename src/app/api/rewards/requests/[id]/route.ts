import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// PUT: Approve or Reject a request
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { status, note } = await req.json(); // status: APPROVED, REJECTED
        const requestId = params.id;

        const request = await prisma.rewardRequest.findUnique({
            where: { id: requestId },
            include: { reward: true }
        });

        if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

        if (status === 'REJECTED' && request.status !== 'REJECTED') {
            // Refund points if rejected
            // Note: In '/buy' we deducted points. So if rejected, we must refund.
            // If approved, points are already gone.

            await prisma.$transaction([
                prisma.rewardRequest.update({
                    where: { id: requestId },
                    // @ts-ignore
                    data: { status: 'REJECTED', note: note as string }
                }),
                prisma.user.update({
                    where: { id: request.userId },
                    data: { points: { increment: request.reward.cost } }
                }),
                // Return stock?
                // In /buy we decremented stock. So yes, increment stock back.
                prisma.reward.update({
                    where: { id: request.rewardId },
                    data: { stock: { increment: 1 } }
                })
            ]);
        } else if (status === 'APPROVED') {
            await prisma.rewardRequest.update({
                where: { id: requestId },
                // @ts-ignore
                data: { status: 'APPROVED', note: note as string } // Points/Stock already handled at purchase time
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}
