import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfWeek, endOfWeek, differenceInMinutes, format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const announcement = await prisma.announcement.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        const today = new Date();
        const month = today.getMonth() + 1;
        const eom = await prisma.employeeOfTheMonth.findFirst({
            where: { month, year: today.getFullYear() },
            include: { user: { select: { name: true } } }
        });

        // Weekly Activity Calculation
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

        const weeklyRecords = await prisma.attendanceRecord.findMany({
            where: {
                userId: session.id,
                timestamp: {
                    gte: weekStart,
                    lte: weekEnd
                }
            },
            orderBy: { timestamp: 'asc' }
        });

        // Calculate hours per day
        const dailyHours: Record<string, number> = {};
        // Initialize days
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const key = format(date, 'yyyy-MM-dd'); // Use ISO date key for mapping
            dailyHours[key] = 0;
        }

        let lastCheckInTime: Date | null = null;
        let currentDayKey: string | null = null;

        weeklyRecords.forEach(record => {
            const recordDayKey = format(record.timestamp, 'yyyy-MM-dd');

            if (record.type === 'CHECK_IN') {
                lastCheckInTime = record.timestamp;
                currentDayKey = recordDayKey;
            } else if (record.type === 'CHECK_OUT' && lastCheckInTime && currentDayKey) {
                // Handle cross-day shifts simply by crediting end-day? 
                // For simplicity, credit to check-in day or split. 
                // Let's credit to check-out day if it matches, or just sum it up.
                // Simple logic: credit to the day of check-out which usually matches check-in unless overnight.
                // Better simple logic: calculate diff and add to recordDayKey.
                const diff = differenceInMinutes(record.timestamp, lastCheckInTime);
                if (dailyHours[recordDayKey] !== undefined) {
                    dailyHours[recordDayKey] += diff;
                }
                lastCheckInTime = null;
            }
        });

        // Handle active session if any (for today)
        if (lastCheckInTime) {
            const now = new Date();
            const recordDayKey = format(now, 'yyyy-MM-dd');
            const diff = differenceInMinutes(now, lastCheckInTime);
            if (dailyHours[recordDayKey] !== undefined) {
                dailyHours[recordDayKey] += diff;
            }
        }

        // Format for Chart
        const chartData = Object.entries(dailyHours).map(([dateStr, minutes]) => {
            const date = new Date(dateStr);
            return {
                day: format(date, 'EEE', { locale: tr }), // Pzt, Sal...
                hours: Number((minutes / 60).toFixed(1)),
                fullDate: dateStr
            };
        });

        return NextResponse.json({
            announcement,
            eom,
            weeklyActivity: chartData
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: "Fetch error" }, { status: 500 });
    }
}
