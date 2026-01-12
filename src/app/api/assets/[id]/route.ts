import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    // Basic MongoDB ObjectID check (24 hex characters)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
        where: { id },
        include: { assignedTo: { select: { id: true, name: true, profilePicture: true } } }
    });

    return NextResponse.json(asset);
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // Action: Assign or Unassign
    let data: any = {};
    if (body.action === 'ASSIGN') {
        data = {
            assignedToId: body.userId,
            status: 'ASSIGNED',
            assignedDate: new Date()
        };
    } else if (body.action === 'RETURN') {
        data = {
            assignedToId: null,
            status: 'AVAILABLE',
            returnDate: new Date()
        };
    } else {
        data = { ...body };
    }

    const asset = await prisma.asset.update({
        where: { id: params.id },
        data
    });

    return NextResponse.json(asset);
}
