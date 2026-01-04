import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { addDays, startOfWeek, endOfWeek, format, nextMonday } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();
    console.log("AI Schedule Config:", config); // Debug log

    if (!config || !config.autoScheduleEnabled) {
        return NextResponse.json({ message: 'Otomatik planlama devre dışı. Ayarlardan aktifleştirin.', debug_config: config });
    }

    try {
        await prisma.systemLog.create({
            data: {
                level: 'AI_ACTION',
                message: 'Otomatik vardiya planlayıcı başlatıldı.',
            }
        });

        // 1. Get next week range
        const start = nextMonday(new Date()); // Start from next Monday
        const end = addDays(start, 6); // Up to Sunday

        // 2. Fetch Staff
        // Exclude those on leave for this period (simplified: just check leave requests overlapping)
        const staff = await prisma.user.findMany({
            where: {
                role: 'STAFF'
            },
            include: {
                workSchedules: true
            }
        });

        let shiftsCreated = 0;
        // 3. Fetch ALL existing shifts for the week at once
        const existingShifts = await prisma.shift.findMany({
            where: {
                start: {
                    gte: start,
                    lt: end
                }
            }
        });


        const requiredStaff = config.minStaffPerShift;
        const newShifts = [];

        // 4. Iterate Days
        for (let i = 0; i < 7; i++) {
            const currentDayDate = addDays(start, i);
            const dayOfWeek = currentDayDate.getDay() === 0 ? 7 : currentDayDate.getDay();

            // Identify available staff
            const availableStaff = staff.filter(user => {
                const preference = user.workSchedules.find(s => s.dayOfWeek === dayOfWeek);
                if (preference && preference.isOffDay) return false;
                // Check if already has a shift this day (in-memory check)
                const hasShift = existingShifts.some(s =>
                    s.userId === user.id &&
                    new Date(s.start).toDateString() === currentDayDate.toDateString()
                );
                return !hasShift;
            });

            // Select staff
            const selectedStaff = availableStaff.slice(0, requiredStaff);

            if (selectedStaff.length < requiredStaff) {
                console.warn(`[AI Scheduler] Not enough staff for ${format(currentDayDate, 'yyyy-MM-dd')}`);
            }

            // Create shift objects
            const [startH, startM] = config.operatingHoursStart.split(':').map(Number);
            const [endH, endM] = config.operatingHoursEnd.split(':').map(Number);

            for (const user of selectedStaff) {
                const shiftStart = new Date(currentDayDate);
                shiftStart.setHours(startH, startM, 0, 0);

                const shiftEnd = new Date(currentDayDate);
                shiftEnd.setHours(endH, endM, 0, 0);

                newShifts.push({
                    userId: user.id,
                    start: shiftStart,
                    end: shiftEnd,
                    title: 'AI Scheduled',
                    color: '#4f46e5'
                });
            }
        }

        // Bulk Create
        if (newShifts.length > 0) {
            await prisma.shift.createMany({
                data: newShifts
            });
            shiftsCreated = newShifts.length;
        }

        await prisma.systemLog.create({
            data: {
                level: 'AI_ACTION',
                message: `Otomatik planlama tamamlandı. ${shiftsCreated} yeni vardiya oluşturuldu.`,
            }
        });

        return NextResponse.json({ message: `Planlama tamamlandı. ${shiftsCreated} vardiya oluşturuldu.`, debug_count: shiftsCreated });

    } catch (e) {
        console.error("Schedule Error:", e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
