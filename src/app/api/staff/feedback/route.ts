import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth'; // Not used if truly anonymous, but maybe for rate limiting?
// Actually, anonymous means we don't store WHO sent it. But we must be authenticated to send it.

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const feedback = await prisma.anonymousFeedback.create({
            data: {
                content: body.content,
                category: body.category,
                sentiment: 0 // Placeholder, handled by AI job later? or sync?
            }
        });

        // Trigger AI Sentiment (Optional sync)
        // const sentiment = await analyzeSentiment(body.content);
        // await prisma.anonymousFeedback.update({ where: { id: feedback.id }, data: { sentiment: sentiment.score }});

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
