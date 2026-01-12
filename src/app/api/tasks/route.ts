import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// GET: List tasks for the logged in user (Admin sees all created by them or all? Let's say Admin sees all/created by them, Staff sees assigned)
export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    try {
        let where: { assignedToId?: string } = {};

        if (session.role === 'ADMIN') {
            // Admin can see all or filter
            // For simplicity, Admin sees tasks they Created OR all tasks.
            // Let's return all tasks for Admin dashboard to manage everything.
            where = {};
        } else {
            // Staff sees tasks assigned TO them
            where = { assignedToId: session.id as string };
        }

        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignedTo: { select: { name: true, id: true } },
                assignedBy: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

// POST: Create a new task (Admin only)
export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { title, description, assignedToId, priority, dueDate } = body;

        const task = await prisma.task.create({
            data: {
                title,
                description,
                assignedToId,
                assignedById: session.id as string,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Send Notification
        // Send Global Notification (DB + Push)
        const { createNotification } = await import('@/lib/notifications');
        await createNotification(assignedToId, "Yeni Görev Atandı 📋", `Görev: ${title}`, 'INFO');

        return NextResponse.json(task);
    } catch {
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
}
