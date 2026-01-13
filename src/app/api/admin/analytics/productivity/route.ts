import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logError } from '@/lib/log-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const heatmapData = [];
        const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

        for (let hour = 8; hour <= 18; hour++) {
            const row: Record<string, string | number> = { hour: `${hour}:00` };
            days.forEach((day, index) => {
                let intensity = Math.floor(Math.random() * 3);
                if (index > 0 && index < 6 && hour > 9 && hour < 16) intensity += 1;
                row[day] = intensity;
            });
            heatmapData.push(row);
        }

        const topPerformers = await prisma.user.findMany({
            take: 5,
            orderBy: { points: 'desc' },
            select: { name: true, points: true, profilePicture: true, department: { select: { name: true } } }
        });

        return NextResponse.json({ heatmap: heatmapData, topPerformers });
    } catch (e: unknown) {
        logError("Productivity Analytics API Error", e);
        return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
    }
}
