import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postingId = searchParams.get('postingId');

    const where = postingId ? { jobPostingId: postingId } : {};

    const candidates = await prisma.candidate.findMany({
        where,
        include: { jobPosting: { select: { title: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(candidates);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, email, phone, jobPostingId, resumeUrl } = body;

        const candidate = await prisma.candidate.create({
            data: {
                name,
                email,
                phone,
                jobPostingId,
                resumeUrl: resumeUrl || '',
                status: 'NEW'
            }
        });

        return NextResponse.json(candidate);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, rating, notes } = body;

        const updated = await prisma.candidate.update({
            where: { id },
            data: { status, rating, notes }
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
