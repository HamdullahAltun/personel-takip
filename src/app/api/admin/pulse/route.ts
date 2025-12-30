import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch recent social posts & comments
        const posts = await prisma.post.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { content: true }
        });

        if (posts.length === 0) {
            return NextResponse.json({
                score: 50,
                summary: "Yeterli veri yok.",
                topics: []
            });
        }

        const texts = posts.map((p: { content: string }) => p.content).join("\n---\n");

        const client = groq;
        if (!client) {
            return NextResponse.json({
                score: 50,
                summary: "AI Modeli yapılandırılmamış (Groq API Key eksik).",
                topics: []
            });
        }

        const prompt = `
        Analyze the following employee social posts and determine the overall "Company Happiness Score" (0-100).
        Also provide a brief 1-sentence summary of the general mood.
        And list top 3 trending topics/keywords as "topics" array.
        
        Posts:
        ${texts}

        Return strictly JSON: { "score": number, "summary": "string", "topics": ["string"] }
        `;

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a sentiment analysis expert. Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
        });

        const text = completion.choices[0]?.message?.content || "";

        // Clean markdown code blocks if present
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        let jsonStr = text;
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = text.substring(firstBrace, lastBrace + 1);
        }

        const analysis = JSON.parse(jsonStr);

        return NextResponse.json(analysis);

    } catch (e) {
        console.error(e);
        return NextResponse.json({
            score: 75, // Fallback
            summary: "Analiz sırasında hata oluştu veya bağlantı kurulamadı.",
            topics: ["Hata"]
        });
    }
}
