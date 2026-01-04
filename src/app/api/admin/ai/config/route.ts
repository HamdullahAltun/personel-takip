import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();
    return NextResponse.json(config || {});
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Upsert equivalent since we only have one config
    const existing = await prisma.aiAutomationConfig.findFirst();

    let config;
    if (existing) {
        // Exclude ID from body if present
        const { id, ...updateData } = body;
        config = await prisma.aiAutomationConfig.update({
            where: { id: existing.id },
            data: updateData
        });
    } else {
        config = await prisma.aiAutomationConfig.create({
            data: body
        });
    }

    return NextResponse.json(config);
}
