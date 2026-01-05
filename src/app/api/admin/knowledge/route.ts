import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const docs = await prisma.knowledgeBaseDoc.findMany({
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(docs);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, content, type, tags } = await req.json();

    const doc = await prisma.knowledgeBaseDoc.create({
        data: {
            title,
            content,
            type,
            tags
        }
    });

    return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    await prisma.knowledgeBaseDoc.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
