import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const logs = await prisma.systemLog.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(logs);
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
