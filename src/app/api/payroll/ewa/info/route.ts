import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: { hourlyRate: true }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // Calculate hours worked this month
        const attendance = await prisma.attendanceRecord.findMany({
            where: {
                userId: session.id,
                timestamp: { gte: start, lte: end }
            },
            orderBy: { timestamp: 'asc' }
        });

        let totalMinutes = 0;
        for (let i = 0; i < attendance.length - 1; i++) {
            if (attendance[i].type === 'CHECK_IN' && attendance[i + 1].type === 'CHECK_OUT') {
                const diff = attendance[i + 1].timestamp.getTime() - attendance[i].timestamp.getTime();
                totalMinutes += diff / (1000 * 60);
                i++; // skip next since we paired it
            }
        }

        const hoursWorked = totalMinutes / 60;
        const totalEarned = hoursWorked * user.hourlyRate;
        const availableAmount = totalEarned * 0.5; // 50% limit

        // Subtract pending/approved EWA requests this month
        const existingRequests = await (prisma.advanceRequest as any).findMany({
            where: {
                userId: session.id,
                type: 'EWA',
                requestedAt: { gte: start, lte: end },
                status: { in: ['PENDING', 'APPROVED'] }
            }
        });

        const totalRequested = existingRequests.reduce((acc: number, curr: any) => acc + curr.amount, 0);
        const finalAvailable = Math.max(0, availableAmount - totalRequested);

        return NextResponse.json({
            hoursWorked: hoursWorked.toFixed(1),
            totalEarned: Math.round(totalEarned),
            availableAmount: Math.round(availableAmount),
            alreadyRequested: Math.round(totalRequested),
            finalAvailable: Math.round(finalAvailable)
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
