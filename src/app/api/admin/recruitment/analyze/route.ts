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
        const { candidateId } = await req.json();

        // 1. Fetch Candidate & Job Details
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { jobPosting: true }
        });

        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        if (!groq) return NextResponse.json({ error: "AI not configured" }, { status: 500 });


        let resumeText = candidate.resumeUrl || "Not provided";

        // Fetch and Parse PDF if URL exists
        if (candidate.resumeUrl && candidate.resumeUrl.startsWith('http')) {
            try {
                const res = await fetch(candidate.resumeUrl);
                if (res.ok) {
                    const buffer = Buffer.from(await res.arrayBuffer());
                    const pdf = await import('pdf-parse');
                    // @ts-ignore
                    const data = await pdf.default(buffer);
                    resumeText = data.text.slice(0, 3000); // Limit context
                }
            } catch (error) {
                console.error("PDF Parse Error", error);
            }
        }

        // 2. Prepare Context
        const prompt = `
            Act as an expert HR Recruiter. Analyze this candidate for the position.
            
            Position: ${candidate.jobPosting.title}
            Description: ${candidate.jobPosting.description}
            
            Candidate Resume Content:
            ${resumeText}
            
            Task:
            1. Score the candidate from 0-100 based on fit.
            2. Provide 2-3 pros and 2-3 cons.
            3. Write a short executive summary (Turkish).
            
            Output strictly JSON:
            {
                "score": 85,
                "summary": "Analiz özeti...",
                "pros": ["Pro 1", "Pro 2"],
                "cons": ["Con 1", "Con 2"]
            }
        `;

        // 3. AI Analysis
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // 4. Save Results
        const updated = await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                aiScore: analysis.score || 50,
                aiNotes: analysis.summary || "Analiz tamamlandı.",
                rating: analysis.score >= 80 ? 5 : analysis.score >= 60 ? 3 : 1
            }
        });

        return NextResponse.json({ candidate: updated, analysis });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
