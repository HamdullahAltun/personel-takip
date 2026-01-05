import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // 1. Fetch Top 50 Users by Points
        const topUsers = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: {
                id: true,
                name: true,
                points: true,
                profilePicture: true,
                department: { select: { name: true } },
                achievements: {
                    select: { title: true, icon: true },
                    take: 3,
                    orderBy: { date: 'desc' }
                },

            },
            orderBy: { points: 'desc' },
            take: 50
        });

        // 2. Fetch Employee of the Month (Current)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const employeeOfTheMonth = await prisma.employeeOfTheMonth.findFirst({
            where: { month: currentMonth + 1, year: currentYear },
            include: { user: { select: { name: true, profilePicture: true, department: { select: { name: true } } } } }
        });

        return NextResponse.json({
            leaderboard: topUsers,
            employeeOfTheMonth
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
