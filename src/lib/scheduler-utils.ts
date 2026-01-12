import { prisma } from "./prisma";
import { startOfWeek, endOfWeek, differenceInHours } from "date-fns";

export async function validateShiftConstraints(userId: string, startTime: Date, endTime: Date) {
    // 1. Check for overlapping shifts
    const overlaps = await prisma.shift.findFirst({
        where: {
            userId,
            status: 'PUBLISHED',
            OR: [
                { startTime: { lte: startTime }, endTime: { gte: startTime } },
                { startTime: { lte: endTime }, endTime: { gte: endTime } },
                { startTime: { gte: startTime }, endTime: { lte: endTime } }
            ]
        }
    });

    if (overlaps) return { valid: false, reason: "Bu saatlerde zaten bir vardiyanız bulunuyor." };

    // 2. Check for Rest Period (min 8 hours before and after)
    const minRest = 8;
    const previousShift = await prisma.shift.findFirst({
        where: { userId, status: 'PUBLISHED', endTime: { lte: startTime } },
        orderBy: { endTime: 'desc' }
    });

    if (previousShift && differenceInHours(startTime, previousShift.endTime) < minRest) {
        return { valid: false, reason: `Yetersiz dinlenme süresi. Önceki vardiyanızdan sonra en az ${minRest} saat dinlenmelisiniz.` };
    }

    const nextShift = await prisma.shift.findFirst({
        where: { userId, status: 'PUBLISHED', startTime: { gte: endTime } },
        orderBy: { startTime: 'asc' }
    });

    if (nextShift && differenceInHours(nextShift.startTime, endTime) < minRest) {
        return { valid: false, reason: `Yetersiz dinlenme süresi. Sonraki vardiyanızdan önce en az ${minRest} saat dinlenmelisiniz.` };
    }

    // 3. Check Weekly Goal
    const startOfW = startOfWeek(startTime, { weekStartsOn: 1 });
    const endOfW = endOfWeek(startTime, { weekStartsOn: 1 });

    const weeklyShifts = await prisma.shift.findMany({
        where: {
            userId,
            status: 'PUBLISHED',
            startTime: { gte: startOfW, lte: endOfW }
        }
    });

    const currentHours = weeklyShifts.reduce((acc, s) => acc + differenceInHours(s.endTime, s.startTime), 0);
    const newShiftHours = differenceInHours(endTime, startTime);

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { weeklyGoal: true } });
    const maxHours = user?.weeklyGoal || 45;

    if (currentHours + newShiftHours > maxHours) {
        return { valid: false, reason: `Haftalık çalışma limitini (${maxHours} saat) aşıyorsunuz.` };
    }

    return { valid: true };
}
