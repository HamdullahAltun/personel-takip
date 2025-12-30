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
                likes: true,
                comments: {
                    include: { user: { select: { name: true, profilePicture: true } } },
                    orderBy: { createdAt: 'desc' }
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

    const { content, imageUrl } = await req.json();

    try {
        const post = await prisma.post.create({
            data: {
                content,
                imageUrl,
                userId: session.id as string
            },
            include: {
                user: { select: { name: true, profilePicture: true } },
                likes: true,
                comments: true
            }
        });
        return NextResponse.json(post);
    } catch (e) {
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
