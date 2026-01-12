
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        // body: { itemId, type: 'IN' | 'OUT', quantity, reason }

        const { itemId, type, quantity, reason } = body;

        // Use transaction for atomic update
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction Record
            await tx.stockTransaction.create({
                data: {
                    itemId,
                    userId: session.id,
                    type,
                    quantity: Number(quantity),
                    reason
                }
            });

            // 2. Update Item Quantity
            const increment = type === 'IN' ? Number(quantity) : -Number(quantity);
            const item = await tx.inventoryItem.update({
                where: { id: itemId },
                data: {
                    quantity: { increment }
                }
            });

            return item;
        });

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
