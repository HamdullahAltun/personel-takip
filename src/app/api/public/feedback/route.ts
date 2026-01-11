import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { taskId, rating, comment } = await req.json();

        // Check if task exists (even if we don't auth the user, we need valid task)
        const task = await prisma.fieldTask.findUnique({
            where: { id: taskId }
        });

        if (!task) {
            return NextResponse.json({ error: "Görev bulunamadı invalid ID" }, { status: 404 });
        }

        // Store feedback
        const feedback = await prisma.customerFeedback.create({
            data: {
                fieldTaskId: taskId,
                rating,
                comment
            }
        });

        // Update User Performance (Simple Average Update or similar)
        // Here we just store it.

        return NextResponse.json({ success: true, feedbackId: feedback.id });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
