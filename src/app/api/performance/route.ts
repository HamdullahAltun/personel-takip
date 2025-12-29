import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        const { searchParams } = new URL(req.url);
        // Allow staff to see their own reviews? 
        // For now, let's strict check ADMIN or if user is viewing their own.
        // But the main use case here is Admin Dashboard.
        // Let's allow if session exists for now, but filter.
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const reviews = await prisma.performanceReview.findMany({
            include: {
                reviewee: { select: { name: true, role: true, profilePicture: true } },
                reviewer: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(reviews);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { revieweeId, period, score, feedback } = body;

        const review = await prisma.performanceReview.create({
            data: {
                reviewerId: session.id as string, // Current Admin is the reviewer
                revieweeId,
                period,
                score: parseInt(score),
                feedback
            }
        });

        // Optional: If score > 85, create an achievement automatically?
        if (parseInt(score) >= 90) {
            await prisma.achievement.create({
                data: {
                    userId: revieweeId,
                    title: `Yüksek Performans: ${period}`,
                    description: `${period} döneminde ${score} puan ile üstün başarı gösterdi.`,
                    icon: 'award' // lucid icon name
                }
            });
        }

        return NextResponse.json(review);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }
}
