import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const items = await prisma.inventoryItem.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(items);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const item = await prisma.inventoryItem.create({
            data: {
                name: body.name,
                category: body.category,
                quantity: parseInt(body.quantity),
                minQuantity: parseInt(body.minQuantity) || 5,
                unit: body.unit,
                location: body.location,
                sku: body.sku || `SKU-${Date.now()}`
            }
        });
        return NextResponse.json(item);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
