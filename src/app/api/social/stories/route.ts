import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { subHours } from 'date-fns';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const notExpired = subHours(new Date(), 24);

        const stories = await prisma.story.findMany({
            where: {
                createdAt: { gte: notExpired },
                expiresAt: { gt: new Date() }
            },
            include: {
                user: { select: { id: true, name: true, profilePicture: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by user
        const groupedStories = stories.reduce((acc: any[], story) => {
            const existingUser = acc.find(g => g.userId === story.userId);
            if (existingUser) {
                existingUser.stories.push(story);
            } else {
                acc.push({
                    userId: story.userId,
                    user: story.user,
                    stories: [story]
                });
            }
            return acc;
        }, []);

        return NextResponse.json(groupedStories);
    } catch (error) {
        console.error("Fetch stories error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { type, content, mediaUrl } = await req.json();

        // Expire in 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.story.create({
            data: {
                userId: session.id,
                type,
                content,
                mediaUrl,
                expiresAt
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Create story error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
