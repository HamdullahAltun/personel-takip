import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) return NextResponse.json({ error: "Start and End required" }, { status: 400 });

    try {
        const shifts = await prisma.shift.findMany({
            where: {
                start: { gte: new Date(start) },
                end: { lte: new Date(end) }
            },
            include: {
                user: { select: { name: true } }
            }
        });
        return NextResponse.json(shifts);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, date, startTime, endTime, title, color } = body;
    // Expecting simplified input: date (YYYY-MM-DD), startTime (HH:mm), endTime (HH:mm)

    // Combine to Date objects
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    // Handle overnight shifts? Assuming same day for now or simple logic
    if (end < start) end.setDate(end.getDate() + 1);

    try {
        const shift = await prisma.shift.create({
            data: {
                userId,
                start,
                end,
                title,
                color
            },
            include: {
                user: { select: { name: true } }
            }
        });
        return NextResponse.json(shift);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.shift.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
