
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Return reviews where user is reviewee (Received reviews)
    const reviews = await prisma.performanceReview.findMany({
        where: { revieweeId: session.id },
        include: { reviewer: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(reviews);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { revieweeId, score, feedback, period } = await req.json();

    // 360 Feedback logic:
    // Anyone can review anyone? Usually limited to same department or peers.
    // For simplicity: allow all.

    let aiInsight = "";
    // Simple AI Analysis of feedback
    try {
        const { analyzeSentiment } = await import('@/lib/ai');
        const sentiment = await analyzeSentiment(feedback);
        if (sentiment.label === 'NEGATIVE') aiInsight = "Geri bildirim yapıcı olmalıdır. İletişim tonuna dikkat edilebilir.";
        else if (sentiment.label === 'POSITIVE') aiInsight = "Harika bir işbirliği örneği!";
    } catch (e) { }

    const review = await prisma.performanceReview.create({
        data: {
            reviewerId: session.id,
            revieweeId,
            score: parseInt(score),
            feedback,
            period: period || new Date().toISOString().slice(0, 7), // YYYY-MM
            aiInsight
        }
    });

    return NextResponse.json(review);
}
