import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch users with location data and basic info
    // cast to any to ensure runtime works even if types are slow to sync
    const staff = await (db.user as any).findMany({
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

    return NextResponse.json(staff);
}
