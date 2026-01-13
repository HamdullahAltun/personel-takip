import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

export async function GET() {
    try {
        const session = await getAuth();
        if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const staff = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true,
                lastLat: true,
                lastLng: true,
                lastLocationUpdate: true,
                fieldTasks: {
                    where: { status: 'IN_PROGRESS' },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });

        await logInfo(`Staff locations viewed by admin ${session.id}`, { count: staff.length });

        return NextResponse.json(staff);
    } catch (error) {
        const { logError } = await import('@/lib/log-utils');
        await logError("Staff Locations API Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
