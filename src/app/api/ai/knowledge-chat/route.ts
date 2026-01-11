import { NextResponse } from 'next/server';
import { getRelevantDocs, logAiQuery } from '@/lib/ai/rag';
import { groq } from '@/lib/ai'; // Imports from index
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!groq) {
        return NextResponse.json({ response: "AI servisi (GROQ) şu anda aktif değil." });
    }

    try {
        const { message, history } = await req.json();

        // 1. Get Context (RAG)
        const relevantContext = await getRelevantDocs(message);

        // 2. Prepare System Prompt
        const systemPrompt = `
Sen Şirket Bilgi Bankası Asistanısın. Görevin çalışanların sorularını ŞİRKET DÖKÜMANLARINA dayanarak cevaplamak.

=== KULLANILABİLİR DÖKÜMANLAR ===
${relevantContext}

KURALLAR:
1. Sadece yukarıdaki dökümanlardaki bilgileri kullan. Bilgi yoksa "Bu konuda dökümanlarda bilgi bulamadım, lütfen İK ile iletişime geçin" de.
2. Cevabın sonuna hangi dökümandan bilgi aldığını parantez içinde ekle. Örn: (Kaynak: Uzaktan Çalışma Yönetmeliği)
3. Profesyonel ve yardımsever ol.
`;

        // 3. Call LLM
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...(history || []).map((h: any) => ({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.text || h.content || ""
                })),
                { role: "user", content: message }
            ],
            model: "llama3-8b-8192", // Fast and capable enough
            temperature: 0.3, // Lower temperature for factual accuracy
        });

        const responseText = completion.choices[0]?.message?.content || "Cevap üretilemedi.";

        // 4. Log the interaction
        // We assume context docs are the sources. Simple implementation.
        await logAiQuery(session.id, message, responseText, ["rag-retrieval"]);

        return NextResponse.json({ response: responseText });

    } catch (e: any) {
        console.error("Knowledge Chat Error:", e);
        return NextResponse.json({ response: "Bir hata oluştu." });
    }
}
