import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function DELETE(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        await prisma.employeeOfTheMonth.deleteMany({
            where: {
                month: currentMonth,
                year: currentYear
            }
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
