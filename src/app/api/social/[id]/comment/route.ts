import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const { content } = await req.json();

    try {
        const comment = await prisma.comment.create({
            data: {
                postId: id,
                userId: session.id as string,
                content
            },
            include: { user: { select: { name: true, profilePicture: true } } }
        });
        return NextResponse.json(comment);
    } catch (e) {
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
