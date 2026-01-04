import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};

    if (type && type !== 'ALL') {
        where.type = type;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } } // Approximation
        ];
    }

    // Use prisma.knowledgeBaseDoc via any cast if types aren't generated yet or standard way
    const docs = await (prisma as any).knowledgeBaseDoc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            content: true,
            type: true,
            tags: true,
            fileUrl: true,
            updatedAt: true
        }
    });

    return NextResponse.json(docs);
}
