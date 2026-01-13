import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!groq) {
        return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        // Fetch recent logs
        const logs = await prisma.systemLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                level: true,
                message: true,
                createdAt: true,
                metadata: true
            }
        });

        if (logs.length === 0) {
            return NextResponse.json({ insight: "Analiz edilecek kayıt bulunamadı." });
        }

        const logSummary = logs.map(l => ({
            lvl: l.level,
            msg: l.message,
            time: l.createdAt.toISOString()
        }));

        const prompt = `
            Aşağıdaki sistem loglarını analiz et ve yöneticiye Türkçe olarak kısa, öz ve aksiyon alınabilir bir özet sun.
            Kritik hatalar var mı? Sık tekrarlanan sorunlar neler? AI robotları düzgün çalışıyor mu?
            
            Loglar (JSON):
            ${JSON.stringify(logSummary)}

            Yanıtını çok kısa tutma ama 3-4 paragrafı da geçme. Maddeler halinde önemli noktaları belirt.
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3
        });

        const insight = completion.choices[0]?.message?.content || "Analiz başarısız.";

        return NextResponse.json({ insight });
    } catch (e) {
        console.error("Log Analysis Error:", e);
        return NextResponse.json({ error: "Failed to analyze logs" }, { status: 500 });
    }
}
