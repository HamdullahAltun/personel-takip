
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logError } from '@/lib/log-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Run queries in parallel for performance
        const [
            totalEmployees,
            todaysRecords,
            pendingLeaves,
            pendingExpenses,
            activeVisitors,
            newCandidates,
            todayBookings
        ] = await Promise.all([
            // 1. Total Employees
            prisma.user.count({ where: { role: { not: 'ADMIN' } } }),

            // 2. Attendance Records for Active/Late calc
            prisma.attendanceRecord.findMany({
                where: { timestamp: { gte: startOfDay } },
                orderBy: { timestamp: 'asc' }, // Scan orderly
                select: { userId: true, type: true, isLate: true }
            }),

            // 3. Pending Leaves
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),

            // 4. Pending Expenses
            prisma.expense.count({ where: { status: 'PENDING' } }),

            // 5. Active Visitors
            prisma.visitor.count({ where: { status: 'ACTIVE' } }),

            // 6. New Job Candidates
            prisma.candidate.count({ where: { status: 'NEW' } }),

            // 7. Today's Reservations
            prisma.booking.count({
                where: {
                    startTime: { gte: startOfDay, lte: endOfDay }
                }
            })
        ]);

        // Process Attendance
        const userState = new Map<string, string>(); // userId -> lastType
        let lateCount = 0;
        const uniqueLateUsers = new Set<string>();

        todaysRecords.forEach(record => {
            userState.set(record.userId, record.type);
            if (record.isLate) uniqueLateUsers.add(record.userId);
        });

        let activeCount = 0;
        userState.forEach((lastType) => {
            if (lastType === 'CHECK_IN') activeCount++;
        });

        lateCount = uniqueLateUsers.size;
        const pendingTotal = pendingLeaves + pendingExpenses;

        return NextResponse.json({
            totalEmployees,
            activeCount,
            lateCount,
            pendingTotal, // Combined count
            activeVisitors,
            newCandidates,
            todayBookings
        });

    } catch (error) {
        logError("Stats API Error", error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
