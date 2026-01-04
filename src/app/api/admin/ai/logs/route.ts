import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const logs = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    return NextResponse.json(logs);
}
