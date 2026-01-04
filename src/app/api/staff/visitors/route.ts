import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET Staff's invite history
export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const visitors = await prisma.visitor.findMany({
        where: { invitedById: (session as any).user.id },
        orderBy: { entryTime: 'desc' }
    });

    return NextResponse.json(visitors);
}

// POST Create new invite
export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, company, visitReason, phone, visitDate } = await req.json();

        // Generate QR content (secure token)
        const qrCode = `VISITOR:${uuidv4()}`;

        const visitor = await prisma.visitor.create({
            data: {
                name,
                company,
                visitReason,
                phone,
                hostName: (session as any).user.name,
                invitedById: (session as any).user.id,
                qrCode: qrCode,
                status: 'PENDING',
                // For future visits, we might want a separate scheduledDate field,
                // but for now we are using entryTime as creation time or scheduled time.
                entryTime: new Date(visitDate || Date.now())
            }
        });

        return NextResponse.json(visitor);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
