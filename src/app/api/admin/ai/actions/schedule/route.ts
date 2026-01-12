import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { addDays, startOfWeek, endOfWeek, format, nextMonday } from 'date-fns';
import { ShiftType, ShiftStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();

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

            }
        });

        let shiftsCreated = 0;
        // 3. Fetch ALL existing shifts for the week at once
        const existingShifts = await prisma.shift.findMany({
            where: {
                startTime: {
                    gte: start,
                    lt: end
                }
            }
        });


        const requiredStaff = config.minStaffPerShift;
        const newShifts: any[] = [];

        // Map to track weekly shift count per user for fairness
        const staffLoad = new Map<string, number>();

        // Initialize load from existing shifts (if any exist for next week, though unlikely if auto-scheduling)
        existingShifts.forEach(s => {
            staffLoad.set(s.userId, (staffLoad.get(s.userId) || 0) + 1);
        });

        // 4. Iterate Days
        for (let i = 0; i < 7; i++) {
            const currentDayDate = addDays(start, i);
            const dayOfWeek = currentDayDate.getDay() === 0 ? 7 : currentDayDate.getDay();

            // Identify available staff
            const availableStaff = staff.filter(user => {
                // Default to standard hours if no schedule preference (legacy)
                const startHour = 9;
                const endHour = 18;


                // Check if already has a shift this day (either existing or newly created in this loop)
                const hasExistingShift = existingShifts.some(s => {
                    if (s.userId === user.id) {
                        const shiftStart = new Date(s.startTime);
                        // Check if already has a shift this day
                        if (
                            shiftStart.getDate() === currentDayDate.getDate() &&
                            shiftStart.getMonth() === currentDayDate.getMonth() &&
                            shiftStart.getFullYear() === currentDayDate.getFullYear()
                        ) {
                            return true; // Found an existing shift for this user on this day
                        }
                    }
                    return false; // No existing shift found for this user on this day
                });
                const hasNewShift = newShifts.some(s =>
                    s.userId === user.id &&
                    s.start.toDateString() === currentDayDate.toDateString()
                );

                return !hasExistingShift && !hasNewShift;
            });

            // Sort by current load (Ascending) -> Pick those with fewest shifts first
            // Add a random tie-breaker to avoid alphabetical bias
            availableStaff.sort((a, b) => {
                const loadA = staffLoad.get(a.id) || 0;
                const loadB = staffLoad.get(b.id) || 0;
                if (loadA !== loadB) return loadA - loadB;
                return Math.random() - 0.5;
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
                // Update Load
                staffLoad.set(user.id, (staffLoad.get(user.id) || 0) + 1);

                const shiftStart = new Date(currentDayDate);
                shiftStart.setHours(startH, startM, 0, 0);

                const shiftEnd = new Date(currentDayDate);
                shiftEnd.setHours(endH, endM, 0, 0);

                newShifts.push({
                    userId: user.id,
                    startTime: shiftStart,
                    endTime: shiftEnd,
                    type: ShiftType.REGULAR,
                    status: ShiftStatus.PUBLISHED,
                    title: 'AI Planned',
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
