import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const where = session.role === 'ADMIN' ? {} : { userId: session.id as string };
    const tasks = await (prisma.fieldTask as any).findMany({
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

    const task = await (prisma.fieldTask as any).create({
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

    const task = await (prisma.fieldTask as any).update({
        where: { id: taskId },
        data
    });

    return NextResponse.json(task);
}
