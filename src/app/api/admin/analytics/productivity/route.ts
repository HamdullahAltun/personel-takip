import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Mocking Heatmap Data for now as real data might be sparse
        // In reality, this would query prisma.task.findMany({ where: { status: 'COMPLETED' } })

        const heatmapData = [];
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        for (let hour = 8; hour <= 18; hour++) {
            const row: any = { hour: `${hour}:00` };
            days.forEach((day, index) => {
                // Random intensity 0-4
                // Simulate higher productivity mid-week mid-day
                let intensity = Math.floor(Math.random() * 3);
                if (index > 0 && index < 6 && hour > 9 && hour < 16) intensity += 1;

                row[day] = intensity;
            });
            heatmapData.push(row);
        }

        // Top Performers (Task Completion Count)
        const topPerformers = await prisma.user.findMany({
            take: 5,
            orderBy: { points: 'desc' }, // Using points as proxy for productivity
            select: { name: true, points: true, profilePicture: true, department: { select: { name: true } } }
        });

        return NextResponse.json({ heatmap: heatmapData, topPerformers });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
