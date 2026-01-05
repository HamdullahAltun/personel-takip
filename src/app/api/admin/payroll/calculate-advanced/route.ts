import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = await req.json(); // e.g. 12, 2025

    // Date range for work calculation
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    // Fetch all staff with their relevant metrics
    const staff = await prisma.user.findMany({
        where: { role: 'STAFF' },
        include: {
            attendance: {
                where: { timestamp: { gte: startDate, lte: endDate } }
            },
            tasksReceived: {
                where: { status: 'COMPLETED', updatedAt: { gte: startDate, lte: endDate } }
            },
            reviewsReceived: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            lmsCompletions: {
                where: { completedAt: { gte: startDate, lte: endDate } },
                include: { module: true }
            }
        }
    });

    const payrollDrafts: any[] = [];

    for (const user of staff) {
        // 1. Calculate Base Salary based on attendance hours (Simulated)
        // In a real app, we'd sum durations between CHECK_IN and CHECK_OUT
        const totalHours = user.attendance.filter(a => a.type === 'CHECK_IN').length * 8; // Mock 8h per check-in
        const baseSalaryAmount = totalHours * (user.hourlyRate || 50);

        // 2. AI/Metric Bonus Logic
        let bonusAmount = 0;

        // Task Bonus: +50 TL per completed task
        bonusAmount += user.tasksReceived.length * 50;

        // Performance Bonus: If score > 80, add 10% of base
        const perfScore = user.reviewsReceived[0]?.score || 0;
        if (perfScore > 80) bonusAmount += baseSalaryAmount * 0.1;

        // LMS Bonus: Points earned from modules
        const lmsPoints = user.lmsCompletions.reduce((acc, c) => acc + (c.module?.points || 0), 0);
        bonusAmount += lmsPoints * 5; // 5 TL per point

        // 3. Deduction Logic: -100 TL per late check-in
        const lateCount = user.attendance.filter(a => a.isLate).length;
        const deductions = lateCount * 100;

        const totalPaid = Math.max(0, baseSalaryAmount + bonusAmount - deductions);

        // Create or Update Payroll Record
        const payroll = await prisma.payroll.upsert({
            where: {
                userId_month_year: {
                    userId: user.id,
                    month,
                    year
                }
            },
            update: {
                baseSalary: baseSalaryAmount,
                bonus: bonusAmount,
                deductions: deductions,
                totalPaid: totalPaid,
                status: 'DRAFT',
                note: `AI Hesaplama: ${user.tasksReceived.length} görev, ${lmsPoints} LMS puanı, ${lateCount} gecikme.`
            },
            create: {
                userId: user.id,
                month,
                year,
                baseSalary: baseSalaryAmount,
                bonus: bonusAmount,
                deductions: deductions,
                totalPaid: totalPaid,
                status: 'DRAFT',
                note: `AI Hesaplama: ${user.tasksReceived.length} görev, ${lmsPoints} LMS puanı, ${lateCount} gecikme.`
            }
        });

        payrollDrafts.push(payroll);
    }

    return NextResponse.json({ success: true, count: payrollDrafts.length });
}
