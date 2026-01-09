import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const posts = await prisma.post.findMany({
            include: {
                user: { select: { name: true, profilePicture: true } },
                kudosTarget: { select: { name: true } },
                likes: true,
                comments: {
                    include: { user: { select: { name: true, profilePicture: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                pollOptions: {
                    include: { votes: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return NextResponse.json(posts);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { content, imageUrl, type, kudosTargetId, kudosCategory, pollOptions } = await req.json();

        const post = await prisma.post.create({
            data: {
                content,
                imageUrl,
                userId: session.id as string,
                type: type || 'STANDARD',
                kudosTargetId,
                kudosCategory,
                pollOptions: (type === 'POLL' && Array.isArray(pollOptions)) ? {
                    create: pollOptions.map((opt: string) => ({ text: opt }))
                } : undefined
            },
            include: {
                user: { select: { name: true, profilePicture: true } },
                kudosTarget: { select: { name: true } },
                likes: true,
                comments: true,
                pollOptions: { include: { votes: true } }
            }
        });

        // Award points if Kudo
        if (type === 'KUDOS' && kudosTargetId) {
            // Future: Add points via gamification service
        }

        return NextResponse.json(post);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
