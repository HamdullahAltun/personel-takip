import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { calculatePayroll } from '@/lib/payroll';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + "");
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + "");

    try {
        const payrolls = await prisma.payroll.findMany({
            where: { month, year },
            include: { user: { select: { name: true, phone: true, hourlyRate: true } } },
            orderBy: { generatedAt: 'desc' }
        });
        return NextResponse.json(payrolls);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payrolls' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, month, year, action } = body;

        // Calculate specific user
        if (userId) {
            const payroll = await calculatePayroll(userId, month, year);
            return NextResponse.json(payroll);
        }

        // Calculate ALL Staff (Bulk)
        if (action === 'CALCULATE_ALL') {
            const users = await prisma.user.findMany({ where: { role: 'STAFF' } });
            const results = [];
            for (const u of users) {
                results.push(await calculatePayroll(u.id, month, year));
            }
            return NextResponse.json({ count: results.length, message: "All payrolls calculated" });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Calculation failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, bonus, deductions } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (bonus !== undefined) updateData.bonus = parseFloat(bonus);
        if (deductions !== undefined) updateData.deductions = parseFloat(deductions);

        // Recalculate total if financial fields change
        if (bonus !== undefined || deductions !== undefined) {
            const current = await prisma.payroll.findUnique({ where: { id } });
            if (current) {
                const newBonus = bonus !== undefined ? parseFloat(bonus) : current.bonus;
                const newDeductions = deductions !== undefined ? parseFloat(deductions) : current.deductions;
                updateData.totalPaid = current.baseSalary + newBonus - newDeductions;
            }
        }

        const updated = await prisma.payroll.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
