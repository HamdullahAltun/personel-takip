import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
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
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { revieweeId, period, score, feedback } = body;

    const review = await prisma.performanceReview.create({
        data: {
            reviewerId: session.id,
            revieweeId: revieweeId,
            period,
            score: parseInt(score),
            feedback
        }
    });

    return NextResponse.json(review);
}
