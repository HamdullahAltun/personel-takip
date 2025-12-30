import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const documents = await prisma.document.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json(documents);
}

export async function POST(req: Request) {
    const session = await getAuth();
    // Allow Staff to upload? Maybe only Admin for Company Drive. 
    // Let's assume Admin uploads Company docs, Staff uploads Personal docs.
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, type, fileUrl, userId } = body; // userId optional if Admin uploading for someone

    // Default to current user if not specified
    const targetUserId = userId || session.id;

    const doc = await prisma.document.create({
        data: {
            title,
            type,
            fileUrl,
            userId: targetUserId
        }
    });

    return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
