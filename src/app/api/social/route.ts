import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { analyzeSentiment } from '@/lib/ai';
import { logInfo, logError } from '@/lib/log-utils';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = 10;

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
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? {
                skip: 1, // Skip cursor
                cursor: { id: cursor }
            } : {})
        });
        return NextResponse.json(posts);
    } catch (e) {
        logError("Failed to fetch posts", e);
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
                userId: session.id,
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
                pollOptions: { include: { votes: true } },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        // Sentiment Analysis
        try {
            const sentiment = await analyzeSentiment(content);
            if (sentiment) {
                await prisma.sentimentLog.create({
                    data: {
                        userId: session.id,
                        type: 'POST',
                        score: sentiment.score,
                        label: (sentiment as any).label || 'neutral',
                        sourceId: post.id,
                        metadata: { kudosCategory }
                    }
                });
            }
        } catch (e) {
            logError("Sentiment analysis failed in social post", e);
        }

        // Award points if Kudo
        if (type === 'KUDOS' && kudosTargetId) {
            await prisma.user.update({
                where: { id: kudosTargetId },
                data: { points: { increment: 10 } }
            });
            logInfo(`Awarded 10 points to ${kudosTargetId} for kudos from ${session.id}`, { postId: post.id });
        }

        logInfo(`New social post created by ${session.id}`, { postId: post.id, type });
        return NextResponse.json(post);
    } catch (e) {
        logError("Failed to create social post", e);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
