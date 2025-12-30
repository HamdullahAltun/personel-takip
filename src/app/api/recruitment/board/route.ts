import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [jobs, candidates] = await Promise.all([
        prisma.jobPosting.findMany({ where: { status: 'ACTIVE' } }),
        prisma.candidate.findMany({ include: { jobPosting: true }, orderBy: { createdAt: 'desc' } })
    ]);

    return NextResponse.json({ jobs, candidates });
}

export async function PUT(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { candidateId, status } = await req.json();
    const candidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: { status }
    });

    return NextResponse.json(candidate);
}
