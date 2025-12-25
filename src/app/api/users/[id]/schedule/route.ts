import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const schedule = await prisma.workSchedule.findMany({
        where: { userId: id },
        orderBy: { dayOfWeek: 'asc' }
    });
    return NextResponse.json(schedule);
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json(); // Array of { dayOfWeek, startTime, endTime, isOffDay }

    // Transactional update/upsert
    const ops = body.map((s: any) =>
        prisma.workSchedule.upsert({
            where: {
                userId_dayOfWeek: { userId: id, dayOfWeek: s.dayOfWeek }
            },
            update: {
                startTime: s.startTime,
                endTime: s.endTime,
                isOffDay: s.isOffDay
            },
            create: {
                userId: id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isOffDay: s.isOffDay
            }
        })
    );

    await prisma.$transaction(ops);
    return NextResponse.json({ success: true });
}
