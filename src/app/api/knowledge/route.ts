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

    // Use standard prisma access now that types are regenerated
    const docs = await prisma.knowledgeBaseDoc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            signatures: {
                where: { userId: session.id as string },
                select: { id: true, signedAt: true }
            }
        }
    });

    const formattedDocs = docs.map(d => ({
        ...d,
        isSigned: d.signatures.length > 0
    }));

    return NextResponse.json(formattedDocs);
}
