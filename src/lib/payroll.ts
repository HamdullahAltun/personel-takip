import { prisma } from "./prisma";

export async function calculatePayroll(userId: string, month: number, year: number) {
    // 1. Get User Data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { workSchedules: true }
    });

    if (!user) throw new Error("User not found");

    // 2. Define Date Range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 3. Get Attendance
    const records = await prisma.attendanceRecord.findMany({
        where: {
            userId: userId,
            timestamp: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    // 4. Calculate Hours Worked
    let totalMinutes = 0;
    // Simple logic: Pair CHECK_IN and CHECK_OUT
    // Or just group by day and calculate diff first-last
    const dailyRecords = new Map<string, typeof records>();

    records.forEach(r => {
        const day = r.timestamp.toDateString();
        if (!dailyRecords.has(day)) dailyRecords.set(day, []);
        dailyRecords.get(day)?.push(r);
    });

    dailyRecords.forEach((dayRecs) => {
        const checkIn = dayRecs.find(r => r.type === 'CHECK_IN');
        const checkOut = dayRecs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).find(r => r.type === 'CHECK_OUT'); // Late one

        if (checkIn && checkOut) {
            const diffMs = checkOut.timestamp.getTime() - checkIn.timestamp.getTime();
            totalMinutes += Math.floor(diffMs / 1000 / 60);
        } else if (checkIn) {
            // Only count if checked out. Or maybe use schedule? 
            // Better to show 0 and alert than guess 8 hours. 
            // But user asked for "proper" calculation. 
            // Let's rely on valid pairs.
        }
    });

    const hoursWorked = totalMinutes / 60;

    // 5. Calculate Financials
    const hourlyRate = user.hourlyRate || 0;
    let baseSalary = 0;

    if (hourlyRate > 0) {
        baseSalary = (hoursWorked * hourlyRate);
    } else {
        // If no hourly rate, assumes fixed salary 0. 
        // User must set hourly rate or handle fixed salary logic manually.
        baseSalary = 0;
    }

    // Check if payroll already exists
    const existing = await prisma.payroll.findFirst({
        where: { userId, month, year }
    });

    if (existing && existing.status === 'PAID') {
        return existing; // Don't recalculate paid ones
    }

    // Create or Update
    // Create or Update
    // Preserve existing manual adjustments
    const finalBonus = existing ? existing.bonus : 0;
    const finalDeductions = existing ? existing.deductions : 0;
    const totalPaid = baseSalary + finalBonus - finalDeductions;

    const data = {
        userId,
        month,
        year,
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        bonus: finalBonus,
        deductions: finalDeductions,
        totalPaid: parseFloat(totalPaid.toFixed(2)),
        status: existing?.status || 'DRAFT',
    };

    if (existing) {
        return await prisma.payroll.update({ where: { id: existing.id }, data });
    } else {
        return await prisma.payroll.create({ data });
    }
}
