import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    try {
        const existing = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId: id,
                    userId: session.id as string
                }
            }
        });

        if (existing) {
            await prisma.like.delete({ where: { id: existing.id } });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.like.create({
                data: {
                    postId: id,
                    userId: session.id as string
                }
            });
            // Add Gamification Point? Maybe later.
            return NextResponse.json({ liked: true });
        }
    } catch (e) {
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}
