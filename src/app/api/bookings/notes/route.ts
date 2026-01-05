import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { bookingId, content, action } = await req.json();

        if (action === 'SUMMARIZE') {
            if (!groq) return NextResponse.json({ error: 'AI config missing' }, { status: 500 });

            const prompt = `
            Act as a professional secretary. Analyze these meeting notes and provide a summary and action items.
            NOTES: "${content}"

            OUTPUT JSON:
            {
                "summary": "Concise summary of the meeting...",
                "actionItems": ["Action 1", "Action 2"]
            }
            `;

            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

            // Save to DB
            await prisma.meetingNote.upsert({
                where: { bookingId },
                update: {
                    content,
                    summary: result.summary,
                    actionItems: result.actionItems
                },
                create: {
                    bookingId,
                    content,
                    summary: result.summary,
                    actionItems: result.actionItems
                }
            });

            return NextResponse.json(result);
        }

        // Just save notes
        const note = await prisma.meetingNote.upsert({
            where: { bookingId },
            update: { content },
            create: { bookingId, content, summary: "", actionItems: [] }
        });

        return NextResponse.json(note);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    if (!bookingId) return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });

    const note = await prisma.meetingNote.findUnique({ where: { bookingId } });
    return NextResponse.json(note || {});
}
