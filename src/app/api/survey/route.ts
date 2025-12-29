import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const surveys = await prisma.survey.findMany({
            where: { isActive: true },
            include: {
                _count: { select: { responses: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(surveys);
    } catch (error) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();

        if (body.action === 'CREATE') {
            if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const { title, questions } = body;
            const survey = await prisma.survey.create({
                data: { title, questions }
            });
            return NextResponse.json(survey);
        }

        if (body.action === 'RESPOND') {
            const { surveyId, answers } = body;
            // Check if already responded? Optional.
            const response = await prisma.surveyResponse.create({
                data: {
                    surveyId,
                    userId: session.id as string,
                    answers
                }
            });
            return NextResponse.json(response);
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
