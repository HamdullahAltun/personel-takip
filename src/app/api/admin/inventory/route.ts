
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const inventory = await prisma.inventoryItem.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(inventory);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const item = await prisma.inventoryItem.create({
            data: {
                name: body.name,
                category: body.category,
                quantity: body.quantity || 0,
                minQuantity: body.minQuantity || 5,
                unit: body.unit || "PCS",
                location: body.location
            }
        });

        // Log initial stock
        if (body.quantity > 0) {
            await prisma.stockTransaction.create({
                data: {
                    itemId: item.id,
                    userId: session.id,
                    type: 'IN',
                    quantity: body.quantity,
                    reason: "Initial Stock"
                }
            });
        }

        return NextResponse.json(item);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
