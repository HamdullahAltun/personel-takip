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
        3. "NONE": Anlaşılamayan veya tanım dışı komut.

        Yanıtın şu JSON formatında olmalı:
        {
            "action": "ACTION_NAME",
            "message": "Kullanıcıya sesli söylenecek kısa yanıt"
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
        if (tasks.length > 0) {
            result.message = `Sıradaki görevin: ${tasks[0].title}.`;
        } else {
            result.message = "Şu an bekleyen bir görevin görünmüyor.";
        }
    }

    // Note: Actual Check-in logic requires location and QR logic, 
    // so we just guide the user for now or mark a placeholder.
    if (result.action === 'CHECK_IN_OUT') {
        result.message = "Giriş/Çıkış işlemini başlatmak için lütfen QR kamerasını açın. Sesli onayınız alındı.";
    }

    return NextResponse.json(result);
}
