import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = session.role === 'ADMIN' ? {} : { userId: session.id as string };
    const tasks = await prisma.fieldTask.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tasks);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, clientName, location, lat, lng, userId } = await req.json();

    const task = await prisma.fieldTask.create({
        data: {
            title,
            description,
            clientName,
            location,
            lat,
            lng,
            userId: userId || session.id
        }
    });

    // Send Notification if assigned to someone else
    if (userId && userId !== session.id) {
        try {
            const { sendPushNotification } = await import('@/lib/notifications');
            await sendPushNotification(userId, "Yeni Saha Görevi 📍", `Göreviniz: ${title} - ${clientName || 'Müşteri'}`);
        } catch (e) {
            console.error("Notification failed", e);
        }
    }

    return NextResponse.json(task);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { taskId, status, checkInLat, checkInLng, notes } = await req.json();

    const data: any = { status };
    if (status === 'IN_PROGRESS') data.checkInTime = new Date();
    if (status === 'COMPLETED') data.checkOutTime = new Date();
    if (checkInLat) data.checkInLat = checkInLat;
    if (checkInLng) data.checkInLng = checkInLng;
    if (notes) data.notes = notes;

    const task = await prisma.fieldTask.update({
        where: { id: taskId },
        data
    });

    // Update User's last known location globally
    if (checkInLat && checkInLng) {
        await prisma.user.update({
            where: { id: task.userId },
            data: {
                lastLat: checkInLat,
                lastLng: checkInLng,
                lastLocationUpdate: new Date()
            }
        });
    }

    if (status === 'COMPLETED') {
        // Gamification Trigger
        const { checkAndAwardBadges } = await import('@/lib/gamification');
        await checkAndAwardBadges(task.userId, 'TASK_COMPLETE');
    }

    return NextResponse.json(task);
}
