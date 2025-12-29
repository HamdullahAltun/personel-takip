import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        let surveys;
        if (session.role === 'ADMIN') {
            // Admin sees all surveys + full response details
            surveys = await prisma.survey.findMany({
                include: {
                    responses: {
                        include: {
                            // If you want to see WHO voted, assume relation exists or just fetch userId
                        }
                    },
                    _count: { select: { responses: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Staff sees only active surveys
            // We need to know if THIS user has responded
            const allSurveys = await prisma.survey.findMany({
                where: { isActive: true },
                include: {
                    _count: { select: { responses: true } }
                },
                orderBy: { createdAt: 'desc' }
            });

            // Check if user has responded to each
            const myResponses = await prisma.surveyResponse.findMany({
                where: {
                    userId: session.id as string,
                    surveyId: { in: allSurveys.map(s => s.id) }
                },
                select: { surveyId: true }
            });

            const respondedSet = new Set(myResponses.map(r => r.surveyId));

            surveys = allSurveys.map(s => ({
                ...s,
                hasResponded: respondedSet.has(s.id)
            }));
        }

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

            // Check if already responded
            const existing = await prisma.surveyResponse.findFirst({
                where: {
                    surveyId,
                    userId: session.id as string
                }
            });

            if (existing) {
                return NextResponse.json({ error: 'Already voted' }, { status: 409 });
            }

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

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, isActive, title, questions } = body;

        const data: any = {};
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (title) data.title = title;
        if (questions) data.questions = questions;

        const updated = await prisma.survey.update({
            where: { id },
            data
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id } = body;

        // Delete responses first (cascade manually if not set in DB)
        await prisma.surveyResponse.deleteMany({ where: { surveyId: id } });
        await prisma.survey.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
