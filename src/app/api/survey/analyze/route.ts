import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { surveyId } = await req.json();

        const responses = await prisma.surveyResponse.findMany({
            where: { surveyId },
            select: { answers: true }
        });

        // Extract text comments
        let comments: string[] = [];
        responses.forEach((r: any) => {
            if (r.answers && typeof r.answers === 'object') {
                Object.values(r.answers).forEach((val: any) => {
                    if (typeof val === 'string' && val.length > 2) {
                        comments.push(val);
                    }
                });
            }
        });

        if (comments.length === 0) {
            return NextResponse.json({ summary: "Analiz edilecek yeterli yazılı yorum bulunamadı." });
        }

        if (!groq) {
            return NextResponse.json({ summary: "AI servisi yapılandırılmamış." });
        }

        // Limit comments to avoid token limits
        const textData = comments.slice(0, 50).join("\n- ");

        const prompt = `
        Act as an HR Analyst. Analyze the following employee survey comments and provide a professional summary in Turkish.
        Structure the summary with:
        1. Genel Duygu (General Sentiment)
        2. Öne Çıkan Olumlu Noktalar (Key Positives)
        3. Gelişim Alanları & Şikayetler (Areas for Improvement)
        
        Keep it concise and actionable.

        COMMENTS:
        - ${textData}
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 800
        });

        return NextResponse.json({ summary: completion.choices[0]?.message?.content });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ summary: "Analiz sırasında bir hata oluştu." });
    }
}
