import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();

    // Find checking-ins for today
    const checkIns = await prisma.attendanceRecord.findMany({
        where: {
            type: 'CHECK_IN',
            timestamp: {
                gte: startOfDay(today),
                lte: endOfDay(today)
            }
        },
        include: { user: { select: { id: true, name: true, profilePicture: true, role: true } } }
    });

    // Determine who is currently still inside (no check-out after check-in)
    // This is a simplified logic. Real logic matches pairings.
    // For "Live Status", we assume if they checked in today and haven't checked out yet.

    const activeUsers = [];

    for (const checkIn of checkIns) {
        const checkOut = await prisma.attendanceRecord.findFirst({
            where: {
                userId: checkIn.userId,
                type: 'CHECK_OUT',
                timestamp: { gt: checkIn.timestamp }
            }
        });

        if (!checkOut) {
            activeUsers.push({
                ...checkIn.user,
                checkInTime: checkIn.timestamp
            });
        }
    }

    return NextResponse.json(activeUsers);
}
