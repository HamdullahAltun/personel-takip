import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const userId = session.id;

        // Verify story exists
        const story = await prisma.story.findUnique({
            where: { id },
            select: { viewers: true }
        });

        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        // Check if already viewed to avoid unnecessary writes
        if (!story.viewers.includes(userId)) {
            await prisma.story.update({
                where: { id },
                data: {
                    viewers: {
                        push: userId
                    }
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Story View Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
