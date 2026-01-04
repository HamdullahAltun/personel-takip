import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignments = await prisma.checklistAssignment.findMany({
        where: { userId: session.id as string },
        include: { checklist: { include: { items: true } } }
    });

    return NextResponse.json(assignments);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId, itemId, completed } = await req.json();

    const assignment = await prisma.checklistAssignment.findUnique({
        where: { id: assignmentId as string }
    });

    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const progress = (assignment.progress as Record<string, boolean>) || {};
    progress[itemId] = completed;

    const updated = await prisma.checklistAssignment.update({
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
