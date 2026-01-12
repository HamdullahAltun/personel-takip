import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SchedulerConfig {
    startDate: Date;
    endDate: Date;
    minStaffPerShift: number;
    operatingHoursStart: number; // 9
    operatingHoursEnd: number; // 18
}

export async function generateSchedule(config: SchedulerConfig) {
    const users = await prisma.user.findMany({
        where: { role: "STAFF" }
    });

    const days = [];
    let currentDate = new Date(config.startDate);
    while (currentDate <= config.endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const newShifts = [];

    // Simple heuristic: Rotate staff
    let staffIndex = 0;

    for (const day of days) {
        // Skip weekends if needed, but let's assume 7 days

        // Creating a 9-18 shift
        const shiftStart = new Date(day);
        shiftStart.setHours(config.operatingHoursStart, 0, 0, 0);

        const shiftEnd = new Date(day);
        shiftEnd.setHours(config.operatingHoursEnd, 0, 0, 0);

        // Assign 'minStaffPerShift' users
        for (let i = 0; i < config.minStaffPerShift; i++) {
            if (users.length === 0) break;

            const user = users[staffIndex % users.length];
            staffIndex++;

            newShifts.push({
                userId: user.id,
                startTime: new Date(shiftStart),
                endTime: new Date(shiftEnd),
                type: "REGULAR",
                status: "PUBLISHED",
                title: "Otomatik Vardiya",
                location: "Merkez Ofis"
            });
        }
    }

    // Bulk create
    // Prisma doesn't support createMany with relations well in some versions but for simple models it does.
    // Or we loop.

    // For safety, let's create one by one or createMany if supported for MongoDB (MongoDB supports createMany)
    if (newShifts.length > 0) {
        await prisma.shift.createMany({
            data: newShifts
        });
    }

    return { created: newShifts.length };
}
