import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { command } = await req.json();
    if (!groq) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

    const systemPrompt = `
        Sen bir İK asistanısın. Kullanıcının sesli komutunu (Türkçe) analiz et ve şu aksiyonlardan birine karar ver:
        1. "CHECK_IN_OUT": Kullanıcı giriş veya çıkış yapmak istiyorsa.
        2. "TASK_QUERY": Kullanıcı sıradaki görevini veya görevlerini soruyorsa.
        3. "SHIFT_QUERY": Kullanıcı vardiyasını, mesai saatini veya ne zaman çalışacağını soruyorsa.
        4. "LEAVE_QUERY": Kullanıcı izin hakkını, kalan iznini veya tatil bilgisini soruyorsa.
        5. "NONE": Anlaşılamayan veya tanım dışı komut.

        Yanıtın şu JSON formatında olmalı:
        {
            "action": "ACTION_NAME",
            "message": "Kullanıcıya sesli söylenecek kısa ve net yanıt (eğer veri yoksa genel konuş)"
        }
    `;

    const completion = await groq.chat.completions.create({
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: command }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

    // Execute logic based on action
    if (result.action === 'TASK_QUERY') {
        const tasks = await (prisma.task as any).findMany({
            where: { assignedToId: session.id as string, status: 'PENDING' },
            take: 1,
            orderBy: { dueDate: 'asc' }
        });
        result.message = tasks.length > 0 ? `Sıradaki görevin: ${tasks[0].title}.` : "Şu an bekleyen bir görevin görünmüyor.";
    }

    if (result.action === 'SHIFT_QUERY') {
        const nextShift = await (prisma as any).shift.findFirst({
            where: { userId: session.id as string, start: { gte: new Date() } },
            orderBy: { start: 'asc' }
        });
        if (nextShift) {
            const dateStr = new Date(nextShift.start).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeStr = `${new Date(nextShift.start).getHours()}:${new Date(nextShift.start).getMinutes().toString().padStart(2, '0')}`;
            result.message = `Bir sonraki vardiyan ${dateStr} saat ${timeStr}'da başlıyor.`;
        } else {
            result.message = "Yakın tarihte planlanmış bir vardiyan bulunmuyor.";
        }
    }

    if (result.action === 'LEAVE_QUERY') {
        const user = await prisma.user.findUnique({
            where: { id: session.id as string },
            select: { annualLeaveDays: true }
        });
        result.message = `Toplam ${user?.annualLeaveDays || 0} gün yıllık izin hakkın bulunuyor.`;
    }

    // Note: Actual Check-in logic requires location and QR logic.
    if (result.action === 'CHECK_IN_OUT') {
        result.message = "Giriş/Çıkış işlemini başlatmak için lütfen QR kamerasını açın. Sesli onayınız alındı.";
    }

    return NextResponse.json(result);
}
