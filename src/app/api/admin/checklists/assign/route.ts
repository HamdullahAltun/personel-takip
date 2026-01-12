import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    // Admin assigns checklist to user
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, checklistId } = await req.json();

    if (!userId || !checklistId) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if already assigned active? (Optional, skipping for simplicity)

    const checklist = await prisma.checklist.findUnique({
        where: { id: checklistId },
        include: { items: true }
    });

    if (!checklist) {
        return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
    }

    const assignment = await prisma.checklistAssignment.create({
        data: {
            userId,
            checklistId,
            progress: {},
            status: 'IN_PROGRESS'
        }
    });

    // Create Tasks for User
    if (checklist.items && checklist.items.length > 0) {
        const tasksToCreate = checklist.items.map(item => ({
            title: item.task,
            description: `Onboarding Görevi: ${item.category || 'Genel'}`,
            status: 'PENDING' as const,
            priority: 'HIGH' as const,
            assignedToId: userId,
            assignedById: session.id, // Assigned by Admin
            tags: ['onboarding', checklist.type.toLowerCase()]
        }));

        await prisma.task.createMany({
            data: tasksToCreate
        });
    }

    // Notify User
    try {
        const { sendPushNotification } = await import('@/lib/notifications');
        await sendPushNotification(userId, "Yeni Görev Listesi 📋", `${checklist.title} süreci atandı ve görevleriniz oluşturuldu.`);
    } catch (e) {
        // ignore
    }

    return NextResponse.json(assignment);
}
