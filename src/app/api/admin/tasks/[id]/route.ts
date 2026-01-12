
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();

        const task = await prisma.task.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                status: body.status,
                priority: body.priority,
                columnId: body.columnId, // Important for Kanban moves
                dueDate: body.dueDate,
                assignedToId: body.assignedToId
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

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
