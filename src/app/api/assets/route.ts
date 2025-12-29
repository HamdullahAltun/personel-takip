import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    try {
        const where = userId ? { assignedToId: userId } : {};
        const assets = await prisma.asset.findMany({
            where,
            include: { assignedTo: { select: { name: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, serialNumber, type, status, notes } = body;

        const asset = await prisma.asset.create({
            data: {
                name,
                serialNumber,
                type,
                status, // AVAILABLE, ASSIGNED, etc.
                notes
            }
        });

        return NextResponse.json(asset);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, assignedToId, status, notes, action } = body;

        if (action === 'ASSIGN') {
            const updated = await prisma.asset.update({
                where: { id },
                data: {
                    assignedToId,
                    status: 'ASSIGNED',
                    assignedDate: new Date(),
                    notes
                },
                include: { assignedTo: true }
            });
            return NextResponse.json(updated);
        }

        if (action === 'RETURN') {
            const updated = await prisma.asset.update({
                where: { id },
                data: {
                    assignedToId: null,
                    status: 'AVAILABLE',
                    assignedDate: null,
                    returnDate: new Date(),
                    notes
                }
            });
            return NextResponse.json(updated);
        }

        // Generic Update
        const updated = await prisma.asset.update({
            where: { id },
            data: {
                status,
                notes,
                // ... other fields if needed
            }
        });
        return NextResponse.json(updated);

    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
