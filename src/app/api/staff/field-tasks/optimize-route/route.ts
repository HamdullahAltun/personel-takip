import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // 1. Fetch pending tasks for this user today
        const tasks = await prisma.fieldTask.findMany({
            where: {
                userId: session.id,
                status: 'PENDING'
            }
        });

        if (tasks.length === 0) return NextResponse.json({ message: "Optimize edilecek görev bulunamadı." });

        // 2. Fetch start location (Office or current)
        const settings = await prisma.companySettings.findFirst();
        let currentLat = settings?.officeLat || 41.0082;
        let currentLng = settings?.officeLng || 28.9784;

        // 3. Simple Nearest Neighbor Optimization
        const optimized = [];
        let remaining = [...tasks.filter(t => t.lat && t.lng)];

        while (remaining.length > 0) {
            remaining.sort((a, b) => {
                const dA = calculateDistance(currentLat, currentLng, a.lat!, a.lng!);
                const dB = calculateDistance(currentLat, currentLng, b.lat!, b.lng!);
                return dA - dB;
            });

            const nearest = remaining.shift()!;
            optimized.push(nearest);
            currentLat = nearest.lat!;
            currentLng = nearest.lng!;
        }

        // 4. Update tasks with optimizedOrder
        for (let i = 0; i < optimized.length; i++) {
            await (prisma.fieldTask as any).update({
                where: { id: optimized[i].id },
                data: { optimizedOrder: i + 1 }
            });
        }

        return NextResponse.json({
            success: true,
            message: "Rota başarıyla optimize edildi.",
            optimizedTasks: optimized.map(t => ({ id: t.id, title: t.title }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
