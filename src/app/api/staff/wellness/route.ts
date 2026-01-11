import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const [activities, challenges] = await Promise.all([
            prisma.wellnessActivity.findMany({
                where: {
                    userId: session.id,
                    date: { gte: start, lte: end }
                },
                orderBy: { date: 'desc' }
            }),
            prisma.wellnessChallenge.findMany({
                where: { isActive: true },
                take: 3
            })
        ]);

        return NextResponse.json({ activities, challenges });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const activity = await prisma.wellnessActivity.create({
            data: {
                userId: session.id,
                type: body.type,
                value: parseFloat(body.value),
                unit: body.unit,
                date: new Date()
            }
        });
        return NextResponse.json(activity);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
