import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const visitors = await prisma.visitor.findMany({
            orderBy: { entryTime: 'desc' }
        });
        return NextResponse.json(visitors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch visitors' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, phone, company, visitReason, hostName } = body;

        // Generate a random unique QR content (e.g., VISITOR-uuid)
        const qrCode = `VISITOR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        const visitor = await prisma.visitor.create({
            data: {
                name, phone, company, visitReason, hostName,
                qrCode,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json(visitor);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, action } = body;

        if (action === 'EXIT') {
            const updated = await prisma.visitor.update({
                where: { id },
                data: {
                    exitTime: new Date(),
                    status: 'COMPLETED'
                }
            });
            return NextResponse.json(updated);
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
