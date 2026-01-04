import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const logs = await prisma.assetLog.findMany({
        where: { assetId: id },
        orderBy: { date: 'desc' },
    });
    return NextResponse.json(logs);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { type, description, cost, date } = await req.json();

        const log = await prisma.assetLog.create({
            data: {
                assetId: id,
                type,
                description,
                cost: Number(cost),
                date: new Date(date),
                performedBy: session.name || "System"
            }
        });

        // If maintenance, update asset status
        if (type === 'MAINTENANCE') {
            await prisma.asset.update({
                where: { id },
                data: { status: 'MAINTENANCE' }
            });
        }

        // If repair finished or return from maintenance, assume available? 
        // Logic can be complex, let's just log it for now.

        return NextResponse.json(log);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to add log' }, { status: 500 });
    }
}
