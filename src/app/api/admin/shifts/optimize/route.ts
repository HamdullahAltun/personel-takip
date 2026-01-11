import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { addDays, format, startOfWeek } from 'date-fns';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { startDate, constraints } = body;

        // Fetch eligible staff
        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: { id: true, name: true, weeklyGoal: true }
        });

        // Basic Constraint Logic (Mock AI Solver)
        // In real world, use Constraint Programming (e.g., OR-Tools)
        const generatedShifts: { userId: string; userName: string; date: string; startTime: string; endTime: string; type: string; }[] = [];
        const shiftsPerDay = 3; // 08-16, 16-24, 24-08
        const currentDate = new Date(startDate);

        for (let i = 0; i < 7; i++) { // 7 days
            const dateStr = format(addDays(currentDate, i), 'yyyy-MM-dd');

            for (let shiftIdx = 0; shiftIdx < shiftsPerDay; shiftIdx++) {
                // Determine needed staff count based on constraints
                const needed = shiftIdx === 1 ? (constraints.minStaffPeak || 3) : (constraints.minStaffNight || 1);

                // Randomly assign available staff (simplified)
                const available = staff.sort(() => 0.5 - Math.random()).slice(0, needed);

                available.forEach(user => {
                    generatedShifts.push({
                        userId: user.id,
                        userName: user.name,
                        date: dateStr,
                        startTime: shiftIdx === 0 ? '08:00' : shiftIdx === 1 ? '16:00' : '00:00',
                        endTime: shiftIdx === 0 ? '16:00' : shiftIdx === 1 ? '24:00' : '08:00',
                        type: 'AUTO_GENERATED'
                    });
                });
            }
        }

        return NextResponse.json({ success: true, shifts: generatedShifts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
