import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { status, progress } = await req.json();

        // Verify ownership
        const existing = await prisma.goal.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (session.role !== 'ADMIN' && existing.userId !== session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                status,
                progress: Number(progress)
            }
        });

        return NextResponse.json(goal);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session.role !== 'ADMIN' && existing.userId !== session.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
