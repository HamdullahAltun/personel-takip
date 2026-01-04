import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/ai';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const note = await prisma.meetingNote.findUnique({
        where: { bookingId: id }
    });
    return NextResponse.json(note || {});
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const { content, analyze } = await req.json();

        let summary = null;
        let actionItems: string[] = [];

        // If AI analysis is requested
        if (analyze && groq) {
            const prompt = `
                Aşağıdaki toplantı notlarını analiz et.
                1. Kısa bir özet çıkar.
                2. "Yapılacaklar" (Action Items) listesi oluştur.
                Yanıtı SADECE JSON formatında ver:
                {
                    "summary": "...",
                    "actionItems": ["...", "..."]
                }
                
                Notlar:
                ${content}
            `;

            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.1,
                response_format: { type: "json_object" }
            });

            const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
            summary = result.summary;
            actionItems = result.actionItems || [];
        }

        const note = await prisma.meetingNote.upsert({
            where: { bookingId: id },
            update: {
                content,
                ...(summary && { summary, actionItems })
            },
            create: {
                bookingId: id,
                content,
                summary,
                actionItems
            }
        });

        // Notify Organizer
        if (summary) {
            const booking = await prisma.booking.findUnique({
                where: { id },
                include: { user: true }
            });
            if (booking && booking.user.fcmToken) {
                const { sendPushNotification } = await import('@/lib/notifications');
                await sendPushNotification(
                    booking.user.id,
                    "✨ Toplantı Notlarınız Hazır",
                    `"${booking.purpose}" toplantısı için AI özeti oluşturuldu.`,
                    { url: '/booking' }
                );
            }
        }

        return NextResponse.json(note);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }
}
