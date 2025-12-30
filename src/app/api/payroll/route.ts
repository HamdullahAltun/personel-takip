import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// Force dynamic to ensure we get fresh date data
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const paramMonth = searchParams.get('month');
    const paramYear = searchParams.get('year');

    // Admin can see everyone's payroll if no userId specific
    const where: any = {};
    if (userId) {
        where.userId = userId;
        // Security check: Staff can only see own payroll
        if (session.role !== 'ADMIN' && userId !== session.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    } else {
        // If no userId, default to ALL if admin
        if (session.role !== 'ADMIN') {
            // Staff accessing /api/payroll without userId -> show own
            where.userId = session.id;
        }
    }

    if (paramMonth) where.month = parseInt(paramMonth);
    if (paramYear) where.year = parseInt(paramYear);

    const payrolls = await prisma.payroll.findMany({
        where,
        orderBy: [
            { year: 'desc' },
            { month: 'desc' }
        ],
        include: { user: true }
    });

    return NextResponse.json(payrolls);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, status } = body;

    const updated = await prisma.payroll.update({
        where: { id },
        data: { status }
    });

    return NextResponse.json(updated);
}

export async function POST(req: Request) {
    // Generate Payroll for all active users for a given month
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { month, year } = await req.json();

    // Calculate time range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const users = await prisma.user.findMany({
        where: { role: 'STAFF' }
    });

    // Bulk fetch all attendance for this period
    const allRecords = await prisma.attendanceRecord.findMany({
        where: {
            timestamp: {
                gte: startDate,
                lte: endDate
            },
            user: { role: 'STAFF' }
        },
        orderBy: { timestamp: 'asc' }
    });

    // Group records by userId
    const recordsByUser: Record<string, typeof allRecords> = {};
    for (const record of allRecords) {
        if (!recordsByUser[record.userId]) recordsByUser[record.userId] = [];
        recordsByUser[record.userId].push(record);
    }

    const payrolls = [];

    for (const user of users) {
        const userRecords = recordsByUser[user.id] || [];

        let totalMilliseconds = 0;
        let checkInTime: Date | null = null;

        for (const record of userRecords) {
            if (record.type === 'CHECK_IN') {
                // If we already have a checkInTime, it means previous check-in was not closed.
                // We restart the session from this new check-in.
                checkInTime = new Date(record.timestamp);
            } else if (record.type === 'CHECK_OUT' && checkInTime) {
                const checkOutTime = new Date(record.timestamp);
                const duration = checkOutTime.getTime() - checkInTime.getTime();

                // Sanity check: ignore if duration > 16 hours (forgot checkout?)
                // Also ignore negative duration (shouldn't happen with correct DB time)
                if (duration > 0 && duration < 16 * 60 * 60 * 1000) {
                    totalMilliseconds += duration;
                }
                checkInTime = null; // Reset
            }
        }

        const totalHours = totalMilliseconds / (1000 * 60 * 60);

        // 2. Base Salary Calculation
        const hourlyRate = user.hourlyRate || 0;
        const baseSalary = totalHours * hourlyRate;

        // 3. Bonus/Deductions
        const bonus = 0;
        const deductions = 0;

        const totalPaid = baseSalary + bonus - deductions;

        try {
            // Only update DRAFT payrolls. If PAID, do not overwrite unless forced (logic for force not here yet).
            // Actually, for simplicity, we allow overwriting DRAFT and assume PAID are locked by UI logic or check here.

            // Allow update even if PAID? No, that's dangerous. Check first.
            const existingPayroll = await prisma.payroll.findFirst({
                where: {
                    userId: user.id,
                    month,
                    year
                }
            });

            if (existingPayroll && existingPayroll.status === 'PAID') {
                continue;
            }

            const data = {
                baseSalary,
                bonus,
                deductions,
                totalPaid: Math.max(0, totalPaid),
                note: `Otomatik: ${totalHours.toFixed(1)} saat çalışma (${hourlyRate}₺/saat)`
            };

            if (existingPayroll) {
                await prisma.payroll.update({
                    where: { id: existingPayroll.id },
                    data: {
                        baseSalary,
                        totalPaid: Math.max(0, totalPaid),
                        note: data.note
                    }
                });
            } else {
                await prisma.payroll.create({
                    data: {
                        userId: user.id,
                        month,
                        year,
                        ...data,
                        status: 'DRAFT'
                    }
                });
            }
            payrolls.push({ status: 'OK' });
        } catch (e) {
            console.error(`Failed to generate payroll for ${user.name}`, e);
        }
    }

    return NextResponse.json({ count: payrolls.length });
}
