import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { rewardId } = await req.json();

        // Start transaction
        // 1. Check Reward (Active & Stock)
        // 2. Check User Points
        // 3. Deduct Points & Stock
        // 4. Create Request

        const reward = await prisma.reward.findUnique({ where: { id: rewardId } });
        if (!reward || !reward.isActive) {
            return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 });
        }

        if (reward.stock === 0) { // If -1, infinite stock
            return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (!user || user.points < reward.cost) {
            return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Deduct Points
            await tx.user.update({
                where: { id: session.id },
                data: { points: { decrement: reward.cost } }
            });

            // Decrement Stock if not infinite (-1)
            if (reward.stock > 0) {
                await tx.reward.update({
                    where: { id: rewardId },
                    data: { stock: { decrement: 1 } }
                });
            }

            // Create Request
            const request = await tx.rewardRequest.create({
                data: {
                    userId: session.id,
                    rewardId: reward.id,
                    status: 'PENDING' // Or APPROVED immediately if purely digital? Let's say PENDING for now.
                }
            });

            return request;
        });

        return NextResponse.json({ success: true, request: result });

    } catch (error) {
        console.error("Buy Reward Error:", error);
        return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
    }
}
