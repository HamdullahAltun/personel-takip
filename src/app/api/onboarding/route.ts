import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const assignments = await prisma.checklistAssignment.findMany({
        where: { userId: session.id as string },
        include: {
            checklist: { include: { items: true } }
        },
        orderBy: { assignedAt: 'desc' }
    });

    return NextResponse.json(assignments);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assignmentId, itemId, checked } = await req.json();

    const assignment = await prisma.checklistAssignment.findUnique({
        where: { id: assignmentId },
        include: { checklist: { include: { items: true } } }
    });

    if (!assignment || assignment.userId !== session.id) {
        return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const currentProgress = (assignment.progress as any) || {};
    const newProgress = { ...currentProgress, [itemId]: checked };

    // Check completion
    const totalItems = assignment.checklist.items.length;
    const completedItems = Object.values(newProgress).filter(Boolean).length;

    const isCompleted = completedItems === totalItems;

    const updated = await prisma.checklistAssignment.update({
        where: { id: assignmentId },
        data: {
            progress: newProgress,
            status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            completedAt: isCompleted ? new Date() : null
        }
    });

    return NextResponse.json(updated);
}
