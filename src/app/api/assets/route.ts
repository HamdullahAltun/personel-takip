import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const assets = await prisma.asset.findMany({
        include: { assignedTo: { select: { name: true, profilePicture: true } } },
        orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(assets);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const asset = await prisma.asset.create({
        data: {
            name: body.name,
            type: body.type,
            serialNumber: body.serialNumber,
            status: 'AVAILABLE',
            notes: body.notes
        }
    });
    return NextResponse.json(asset);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, action, assignedToId } = body;

    let updateData: any = {};

    if (action === 'ASSIGN') {
        updateData = {
            status: 'ASSIGNED',
            assignedToId: assignedToId,
            assignedDate: new Date()
        };
    } else if (action === 'RETURN') {
        updateData = {
            status: 'AVAILABLE',
            assignedToId: null,
            assignedDate: null
        };
    } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const asset = await prisma.asset.update({
        where: { id },
        data: updateData
    });

    return NextResponse.json(asset);
}
