import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/ai';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = groq;
    if (!client) return NextResponse.json({ error: "Groq not configured" }, { status: 500 });

    try {
        // Fetch users with relevant data for analysis
        const users = await (prisma.user as any).findMany({
            where: { role: 'STAFF' },
            include: {
                attendance: { take: 20, orderBy: { timestamp: 'desc' } },
                reviewsReceived: { take: 3, orderBy: { createdAt: 'desc' } },
                leaves: { take: 5, orderBy: { createdAt: 'desc' } }
            }
        });

        const staffData = users.map((u: any) => ({
            id: u.id,
            name: u.name,
            points: u.points,
            latenessCount: u.attendance.filter((a: any) => a.isLate).length,
            perfScores: u.reviewsReceived.map((p: any) => p.score),
            lastLeave: u.leaves[0]?.startDate
        }));

        const prompt = `
        Aşağıdaki personel verilerini analiz et ve işten ayrılma riski (attrition) en yüksek olan 3 kişiyi belirle.
        Nedenlerini ve risk seviyelerini (%0-%100) açıkla.
        Veriler: ${JSON.stringify(staffData)}
        JSON formatında döndür: { topRisks: [{ name: string, riskLevel: number, reason: string }] }.
        Sadece JSON döndür.
        `;

        const completion = await client.chat.completions.create({
            messages: [{ role: "system", content: "Sen bir kıdemli İK veri analisti asistanısın." }, { role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return NextResponse.json(analysis);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
