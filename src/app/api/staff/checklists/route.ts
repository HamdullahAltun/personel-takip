import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignments = await (prisma as any).checklistAssignment.findMany({
        where: { userId: session.id },
        include: { checklist: { include: { items: true } } }
    });

    return NextResponse.json(assignments);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId, itemId, completed } = await req.json();

    const assignment = await (prisma as any).checklistAssignment.findUnique({
        where: { id: assignmentId }
    });

    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const progress = (assignment.progress as any) || {};
    progress[itemId] = completed;

    const updated = await (prisma as any).checklistAssignment.update({
        where: { id: assignmentId },
        data: {
            progress,
            status: Object.values(progress).every(v => v) ? 'COMPLETED' : 'IN_PROGRESS',
            completedAt: Object.values(progress).every(v => v) ? new Date() : null
        },
        include: { checklist: { include: { items: true } } }
    });

    return NextResponse.json(updated);
}
