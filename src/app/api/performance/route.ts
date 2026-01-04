import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth, AppJWTPayload } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth() as AppJWTPayload | null;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const reviews = await prisma.performanceReview.findMany({
        where: userId ? { revieweeId: userId } : {}, // Admin sees all if no userId
        include: {
            reviewer: { select: { name: true } },
            reviewee: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reviews);
}

export async function POST(req: Request) {
    const session = await getAuth() as AppJWTPayload | null;
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { revieweeId, period, score: scoreStr, feedback } = body as { revieweeId: string, period: string, score: string, feedback: string };
    const score = parseInt(scoreStr);

    // Simple AI Insight Generation (Heuristic)
    let aiInsight = "";
    if (score >= 90) aiInsight = "Mükemmel performans! Terfi veya ödül için değerlendirilmeli. Liderlik potansiyeli yüksek.";
    else if (score >= 80) aiInsight = "Çok iyi performans. İstikrarlı çalışıyor, sorumluluk bilinci yüksek.";
    else if (score >= 60) aiInsight = "Gelişime açık. Bazı konularda desteğe ihtiyacı olabilir, eğitim planlanmalı.";
    else aiInsight = "Düşük performans. Acil durum değerlendirmesi ve performans iyileştirme planı (PIP) gerektirir.";

    const review = await prisma.performanceReview.create({
        data: {
            reviewerId: session.id as string,
            revieweeId: revieweeId,
            period,
            score,
            feedback,
            aiInsight
        }
    });

    // Send Notification
    try {
        const { sendPushNotification } = await import('@/lib/notifications');
        await sendPushNotification(revieweeId, "Yeni Performans Değerlendirmesi", `Yönetici değerlendirmeniz sisteme girildi: ${score}/100`);
    } catch (e) {
        console.error("Notification failed", e);
    }

    return NextResponse.json(review);
}
