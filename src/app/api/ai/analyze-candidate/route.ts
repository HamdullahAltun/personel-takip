import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = groq;
    if (!client) return NextResponse.json({ error: "Groq not configured" }, { status: 500 });

    try {
        const { candidateId } = await req.json();

        const candidate = await (prisma.candidate as any).findUnique({
            where: { id: candidateId },
            include: { jobPosting: true }
        });

        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        const prompt = `
        Aşağıdaki iş ilanı ve aday bilgilerini analiz et.
        İŞ İLANI:
        Başlık: ${candidate.jobPosting.title}
        Gereklilikler: ${candidate.jobPosting.requirements}
        Açıklama: ${candidate.jobPosting.description}

        ADAY:
        İsim: ${candidate.name}
        Notlar: ${candidate.notes || "Belirtilmemiş"}

        GÖREV:
        Adayın bu işe uygunluğunu 0-100 arası bir skorla değerlendir ve kısa bir analiz notu yaz.
        JSON formatında döndür: { score: number, analysis: string }.
        Sadece JSON döndür.
        `;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // Update candidate with AI score
        await (prisma.candidate as any).update({
            where: { id: candidateId },
            data: {
                aiScore: result.score,
                aiNotes: result.analysis
            }
        });

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
