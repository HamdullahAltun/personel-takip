
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { subDays, subMonths } from 'date-fns';
import { logInfo, logError } from '@/lib/log-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        await logInfo('Sistem optimizasyon analizi başlatıldı.', null, 'AI_ACTION');
        let insights = 0;

        // 1. Analyze Late Arrivals (Last 30 days)
        const lastMonth = subDays(new Date(), 30);
        const lateRecords = await prisma.attendanceRecord.groupBy({
            by: ['userId'],
            where: {
                timestamp: { gte: lastMonth },
                isLate: true
            },
            _count: {
                id: true
            },
            having: {
                id: {
                    _count: {
                        gte: 3 // More than 3 late arrivals
                    }
                }
            }
        });

        for (const record of lateRecords) {
            const user = await prisma.user.findUnique({ where: { id: record.userId } });
            if (user) {
                await logInfo(`OPTIMIZER: ${user.name} son 30 günde ${record._count.id} kez geç kaldı. Vardiya saatleri gözden geçirilmeli.`, null, 'WARN');
                insights++;
            }
        }

        // 2. Analyze Pending Tasks (Overdue or Stagnant)
        const stagnantTasks = await prisma.task.count({
            where: {
                status: 'PENDING',
                createdAt: { lt: subDays(new Date(), 7) } // 1 week old pending tasks
            }
        });

        if (stagnantTasks > 0) {
            await logInfo(`OPTIMIZER: ${stagnantTasks} adet görev 7 günden fazladır beklemede. "Görevleri Dağıt" robotunu çalıştırmanız önerilir.`, null, 'AI_ACTION');
            insights++;
        }

        // 3. Low Performance Warning (Last Period)
        // Find recent reviews with score < 60
        const lowReviews = await prisma.performanceReview.findMany({
            where: {
                score: { lt: 60 },
                createdAt: { gte: subMonths(new Date(), 3) }
            },
            include: { reviewee: true }
        });

        for (const review of lowReviews) {
            await logInfo(`OPTIMIZER: ${review.reviewee.name} son değerlendirmede düşük puan (${review.score}) aldı. Eğitim atanması önerilir.`, null, 'WARN');
            insights++;
        }

        if (insights === 0) {
            await logInfo('OPTIMIZER: Sistem analizi tamamlandı. Kritik bir sorun tespit edilmedi.', null, 'INFO');
        }

        return NextResponse.json({ message: "Analiz tamamlandı.", insights });

    } catch (e) {
        logError('Optimizer hatası', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
