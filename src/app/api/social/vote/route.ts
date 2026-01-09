import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { pollOptionId, postId } = await req.json();

        if (!pollOptionId || !postId) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // 1. Check if user already voted on THIS post (any option)
        // We need to find if there is an existing vote by this user on any option linked to this post
        const existingVote = await prisma.pollVote.findFirst({
            where: {
                userId: session.id,
                pollOption: {
                    postId: postId
                }
            }
        });

        if (existingVote) {
            // If clicking same option -> Toggle (Remove)
            if (existingVote.pollOptionId === pollOptionId) {
                await prisma.pollVote.delete({
                    where: { id: existingVote.id }
                });
                return NextResponse.json({ message: "Vote removed" });
            } else {
                // If clicking different option -> Switch vote
                // Delete old, create new
                await prisma.pollVote.delete({
                    where: { id: existingVote.id }
                });
                // Proceed to create new below
            }
        }

        // 2. Create Vote
        await prisma.pollVote.create({
            data: {
                userId: session.id,
                pollOptionId: pollOptionId
            }
        });

        // Return updated poll options for this post
        const updatedPost = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                pollOptions: {
                    include: { votes: true }
                }
            }
        });

        return NextResponse.json(updatedPost?.pollOptions || []);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
    }
}
