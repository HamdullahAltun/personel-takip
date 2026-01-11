import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    // EXECUTIVE role only ideally, but Admin for now
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);

        // 1. Current Month Expenses
        const expenses = await prisma.expense.aggregate({
            where: {
                date: { gte: start, lte: end },
                status: 'APPROVED'
            },
            _sum: { amount: true }
        });

        // 2. Current Month Payroll (Estimated or Real)
        const payrolls = await prisma.payroll.aggregate({
            where: {
                month: today.getMonth() + 1,
                year: today.getFullYear()
            },
            _sum: { totalPaid: true }
        });

        // 3. Trends (Last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(today, i);
            const s = startOfMonth(d);
            const e = endOfMonth(d);

            const exp = await prisma.expense.aggregate({
                where: { date: { gte: s, lte: e }, status: 'APPROVED' },
                _sum: { amount: true }
            });

            // Mock budget or payroll trend if data is sparse
            monthlyData.push({
                month: format(d, 'MMM'),
                expense: exp._sum.amount || 0,
                payroll: (payrolls._sum.totalPaid || 500000) * (0.9 + Math.random() * 0.2) // Mock variation if no data
            });
        }

        return NextResponse.json({
            currentExpense: expenses._sum.amount || 0,
            currentPayroll: payrolls._sum.totalPaid || 0,
            totalBudget: 1000000, // Fixed Monthly Budget
            monthlyData
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
