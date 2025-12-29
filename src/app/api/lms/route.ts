import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const trainings = await prisma.training.findMany({
            include: {
                completions: {
                    where: { userId: session.id as string },
                    select: { completedAt: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(trainings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, url, type } = body;

        const training = await prisma.training.create({
            data: { title, description, url, type }
        });
        return NextResponse.json(training);
    } catch (error) {
        return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, action } = body;

        if (action === 'COMPLETE') {
            // Check if already completed
            const existing = await prisma.trainingCompletion.findUnique({
                where: { userId_trainingId: { userId: session.id as string, trainingId: id } }
            });

            if (!existing) {
                await prisma.trainingCompletion.create({
                    data: { userId: session.id as string, trainingId: id }
                });
            }
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
