import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const announcement = await prisma.announcement.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        const today = new Date();
        const month = today.getMonth() + 1;
        const eom = await prisma.employeeOfTheMonth.findFirst({
            where: { month, year: today.getFullYear() },
            include: { user: { select: { name: true } } }
        });

        return NextResponse.json({
            announcement,
            eom
        });
    } catch (error) {
        return NextResponse.json({ error: "Fetch error" }, { status: 500 });
    }
}
