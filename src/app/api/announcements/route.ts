
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        return NextResponse.json(announcements);
    } catch (e) {
        return NextResponse.json({ error: "Error fetching announcements" }, { status: 500 });
    }
}
