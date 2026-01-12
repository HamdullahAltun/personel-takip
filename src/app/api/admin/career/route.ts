
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const paths = await prisma.careerPath.findMany({
            orderBy: { level: 'asc' }
        });
        return NextResponse.json(paths);
    } catch {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { title, level, requiredSkills } = body;

        const path = await prisma.careerPath.create({
            data: {
                title,
                level: parseInt(level),
                requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : []
            }
        });

        return NextResponse.json(path);
    } catch {
        return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();
        await prisma.careerPath.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
