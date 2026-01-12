
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const tasks = await prisma.task.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                assignedTo: { select: { id: true, name: true, profilePicture: true } }
            }
        });

        return NextResponse.json(tasks);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();

        // If columnId is not provided, try to find the first column of the project
        let columnId = body.columnId;
        if (!columnId) {
            const firstColumn = await prisma.projectColumn.findFirst({
                where: { projectId: id },
                orderBy: { order: 'asc' }
            });
            if (firstColumn) columnId = firstColumn.id;
        }

        const task = await prisma.task.create({
            data: {
                title: body.title,
                description: body.description,
                priority: body.priority || 'MEDIUM',
                projectId: id,
                columnId: columnId,
                assignedToId: body.assignedToId || session.id, // Default to self if not assigned
                assignedById: session.id,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined
            },
            include: {
                assignedTo: { select: { id: true, name: true, profilePicture: true } }
            }
        });

        return NextResponse.json(task);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
