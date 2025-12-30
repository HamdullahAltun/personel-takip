import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const trainings = await prisma.training.findMany({
        include: { completions: { where: { userId: session.id as string } } }, // Check if THIS user completed
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(trainings);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === 'CREATE') {
        if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { title, description, url, type } = body;
        const training = await prisma.training.create({
            data: { title, description, url, type }
        });
        return NextResponse.json(training);
    }

    if (action === 'COMPLETE') {
        const { trainingId } = body;
        // Upsert to avoid double completion
        const completion = await prisma.trainingCompletion.create({
            data: {
                userId: session.id as string,
                trainingId
            }
        });
        return NextResponse.json(completion);
    }
}
