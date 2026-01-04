import { NextResponse } from 'next/server';
import { groq } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = groq;
    if (!client) return NextResponse.json({ error: 'AI Client not ready' }, { status: 500 });

    try {
        // Fetch recent messages for analysis
        const messages = await prisma.message.findMany({
            take: 100,
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true }
        });

        if (messages.length < 5) {
            return NextResponse.json({
                sentiment: 0,
                mood: 'Veri Yetersiz',
                analysis: 'Analiz için yeterli mesaj trafiği yok.',
                alerts: []
            });
        }

        const prompt = `
            Aşağıdaki personel mesajlarını (anonim) analiz et ve şirketin genel "kültür ve duygu" durumunu belirle.
            Yanıtı SADECE geçerli bir JSON formatında ver.
            
            Format:
            {
                "sentimentScore": 0-100 (0: Çok Kötü/Gergin, 100: Çok Pozitif),
                "moodLabel": "Mutlu", "Gergin", "Motivasyonu Düşük" vb.,
                "summary": "...",
                "topKeywords": ["...", "..."],
                "criticalAlerts": ["Kriz riski var mı?", "Mobbing şüphesi?", "Tükenmişlik belirtisi?"],
                "recommendation": "Yönetici ne yapmalı?"
            }

            Mesajlar:
            ${messages.map(m => `[${m.createdAt}] ${m.content}`).join('\n')}
        `;

        const completion = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");

        return NextResponse.json(analysis);

    } catch (e: any) {
        console.error("Culture Analysis Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
