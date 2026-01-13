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

    const { title, content, type, tags, requiresSigning } = await req.json();

    // Ensure tags is a String[]
    const tagList = Array.isArray(tags)
        ? tags
        : (typeof tags === 'string' && tags.trim() !== '')
            ? tags.split(',').map(t => t.trim())
            : [];

    const doc = await prisma.knowledgeBaseDoc.create({
        data: {
            title,
            content,
            type: type || 'GUIDELINE',
            tags: tagList,
            requiresSigning: !!requiresSigning
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
