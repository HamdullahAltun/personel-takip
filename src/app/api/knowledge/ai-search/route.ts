import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { query } = await req.json();

        if (!groq) {
            return NextResponse.json({ answer: "AI servisi şu an devre dışı (API Key eksik)." });
        }

        // 1. Fetch Documents (Naive RAG: Fetch all text)
        // In production, use Vector DB (pgvector/pinecone)
        const docs = await prisma.knowledgeBaseDoc.findMany({
            select: { title: true, content: true },
            take: 20 // Optimize context
        });

        const context = docs.map(d => `DOC: ${d.title}\nCONTENT: ${d.content}`).join("\n\n");

        const prompt = `
        Act as a helpful Company Assistant. Answer the user question based ONLY on the provided Context Documents below.
        If the answer is not in the documents, say "Bilgi bankasında bu konuda veri bulunamadı." (Data not found).
        Keep the answer professional, concise and friendly.
        
        USER QUESTION: "${query}"

        CONTEXT DOCUMENTS:
        ${context}
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 500
        });

        const answer = completion.choices[0]?.message?.content || "Cevap üretilemedi.";

        return NextResponse.json({ answer });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
