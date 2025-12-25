import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            where: { isActive: true }
        });
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: { title, content, isActive: true }
        });

        return NextResponse.json(announcement);
    } catch (error) {
        return NextResponse.json({ error: "Creation failed" }, { status: 500 });
    }
}
