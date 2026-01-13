import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

// Force dynamic to ensure we get fresh date data
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const paramMonth = searchParams.get('month');
    const paramYear = searchParams.get('year');

    const isManager = session.role === 'ADMIN' || session.role === 'EXECUTIVE';

    try {
        const where: any = {};
        if (userId) {
            where.userId = userId;
            // Security check: Staff can only see own payroll
            if (!isManager && userId !== session.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else {
            if (!isManager) {
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
    } catch (e) {
        logError("Failed to fetch payrolls", e);
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status } = body;

        const updated = await prisma.payroll.update({
            where: { id },
            data: { status }
        });

        logInfo(`Payroll ${id} status updated to ${status} by admin ${session.id}`);
        return NextResponse.json(updated);
    } catch (e) {
        logError("Failed to update payroll", e);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { month, year } = await req.json();

        // Calculate time range for the selected month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const users = await prisma.user.findMany({
            where: { role: 'STAFF' }
        });

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
                    checkInTime = new Date(record.timestamp);
                } else if (record.type === 'CHECK_OUT' && checkInTime) {
                    const checkOutTime = new Date(record.timestamp);
                    const duration = checkOutTime.getTime() - checkInTime.getTime();

                    if (duration > 0 && duration < 16 * 60 * 60 * 1000) {
                        totalMilliseconds += duration;
                    }
                    checkInTime = null;
                }
            }

            const totalHours = totalMilliseconds / (1000 * 60 * 60);
            const hourlyRate = user.hourlyRate || 0;
            const baseSalary = totalHours * hourlyRate;
            const bonus = 0;
            const deductions = 0;
            const totalPaid = baseSalary + bonus - deductions;

            try {
                const existingPayroll = await prisma.payroll.findFirst({
                    where: { userId: user.id, month, year }
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
                logError(`Failed to generate payroll for ${user.name}`, e);
            }
        }

        logInfo(`Bulk payroll generation completed for ${month}/${year}. Result: ${payrolls.length} processed.`);
        return NextResponse.json({ count: payrolls.length });
    } catch (e) {
        logError("Major payroll generation failure", e);
        return NextResponse.json({ error: "Batch generation failed" }, { status: 500 });
    }
}
