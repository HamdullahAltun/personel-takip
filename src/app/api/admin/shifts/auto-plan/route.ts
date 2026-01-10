import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = groq;
    if (!client) return NextResponse.json({ error: "Groq not configured" }, { status: 500 });

    try {
        const { startDate, days = 7 } = await req.json();

        const staff = await (prisma.user as any).findMany({
            where: { role: 'STAFF' },
            select: { id: true, name: true, points: true }
        });

        const prompt = `
        GÖREV: ${days} günlük bir vardiya planı oluştur.
        PERSONEL: ${JSON.stringify(staff)}
        BAŞLANGIÇ TARİHİ: ${startDate}
        
        KURALLAR:
        1. Her gün için en az 2 kişi atanmalı.
        2. Sabah (09:00-17:00) ve Akşam (17:00-01:00) vardiyaları olsun.
        3. Puanı yüksek olanlara daha az yoğunluk verebilirsin.

        
        SADECE JSON döndür: { shifts: [{ userId: string, start: string (ISO), end: string (ISO), title: string }] }
        `;

        const completion = await client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

        // Save generated shifts to DB
        const createdShifts = await Promise.all(
            result.shifts.map((s: any) =>
                (prisma.shift as any).create({
                    data: {
                        userId: s.userId,
                        start: new Date(s.start),
                        end: new Date(s.end),
                        title: s.title,
                        color: s.title.includes("Sabah") ? "#fbbf24" : "#6366f1"
                    }
                })
            )
        );

        return NextResponse.json({ message: "Vardiyalar başarıyla oluşturuldu", count: createdShifts.length });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
