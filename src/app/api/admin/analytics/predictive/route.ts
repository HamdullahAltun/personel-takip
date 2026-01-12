import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [risks, sentimentLogs] = await Promise.all([
            prisma.attritionRisk.findMany({
                orderBy: { riskScore: 'desc' },
                include: { user: { select: { id: true, name: true, role: true, profilePicture: true } } }
            }),
            prisma.sentimentLog.findMany({
                where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                select: { score: true }
            })
        ]);

        const avgSentiment = sentimentLogs.length > 0
            ? sentimentLogs.reduce((acc, l) => acc + l.score, 0) / sentimentLogs.length
            : 0;

        const stats = {
            total: risks.length,
            highRisk: risks.filter(r => r.riskScore > 70).length,
            avgSentiment: avgSentiment.toFixed(1),
            moodLabel: avgSentiment > 0.3 ? 'Pozitif' : avgSentiment < -0.3 ? 'Negatif' : 'Nötr',
            satisfaction: (8.0 + (avgSentiment * 2)).toFixed(1) // Derivative stat
        };

        return NextResponse.json({ risks, stats });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
