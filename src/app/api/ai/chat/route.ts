
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groq, getRelevantDocs, logAiQuery } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { message } = await req.json();

        if (!groq) {
            return NextResponse.json({
                response: "AI sistemi şu anda yapılandırılmamış (API Key eksik). Lütfen yönetici ile iletişime geçin.",
                isMock: true
            });
        }

        // 1. Gather Personal Context (Fast, always fetched for now)
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            include: {
                leaves: { where: { status: 'APPROVED' } },
                shifts: {
                    where: { startTime: { gte: new Date() } },
                    take: 3,
                    orderBy: { startTime: 'asc' }
                },
                department: true
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const personalContext = `
        KULLANICI BİLGİLERİ:
        İsim: ${user.name}
        Departman: ${user.department?.name || "Bilinmiyor"}
        Yıllık İzin Hakkı (Toplam): ${user.annualLeaveDays} gün
        Kullanılan İzinler (Onaylı): ${user.leaves.length} adet
        Gelecek Vardiyalar:
        ${user.shifts.map(s => `- ${s.startTime.toLocaleString('tr-TR')} (${s.type})`).join('\n')}
        `;

        // 2. Gather Company Context (RAG)
        const companyDocs = await getRelevantDocs(message);

        // 3. Construct System Prompt
        const systemPrompt = `
        Sen yardımcı, profesyonel ve arkadaş canlısı bir İK asistanısın.
        Şirket çalışanlarının sorularını yanıtlıyorsun.
        
        Aşağıdaki bağlamı kullanarak cevap ver:
        
        --- KİŞİSEL VERİLER ---
        ${personalContext}
        
        --- ŞİRKET BİLGİ BANKASI ---
        ${companyDocs}
        
        KURALLAR:
        1. Sadece verilen bilgilerle cevap ver. Bilmiyorsan "Bu konuda bilgim yok" de.
        2. Maaş, prim gibi finansal verileri ASLA sorma ve asla tahmin etme.
        3. Cevapların kısa, net ve Türkçe olsun.
        4. Çalışana ismiyle hitap et.
        `;

        // 4. Call LLM
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant", // Fast and capable enough
            temperature: 0.3,
        });

        const responseContent = completion.choices[0]?.message?.content || "Üzgünüm, şu an cevap veremiyorum.";

        // 5. Log Query
        await logAiQuery(session.id, message, responseContent);

        return NextResponse.json({ response: responseContent });

    } catch (e: any) {
        console.error("AI Chat Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
