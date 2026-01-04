import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const modules = await (prisma as any).lmsModule.findMany({
        include: { completions: { where: { userId: session.id as string } } },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(modules);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ADMIN ACTIONS
    if (session.role === 'ADMIN' || session.role === 'EXECUTIVE') {
        if (action === 'CREATE') {
            const { title, description, contentUrl, type, category, points } = body;
            const module = await (prisma as any).lmsModule.create({
                data: { title, description, contentUrl, type, category, points: parseInt(points) || 10 }
            });
            return NextResponse.json(module);
        }

        if (action === 'GENERATE_QUIZ') {
            const { title, description } = body;
            if (!groq) return NextResponse.json({ error: 'AI not configured' }, { status: 500 });

            const prompt = `
                Sana bir eğitim başlığı ve açıklaması vereceğim. Bu eğitime uygun 3 soruluk bir test hazırla.
                Format kesinlikle şu JSON yapısında olmalı:
                [
                    { "question": "Soru metni", "options": ["A", "B", "C", "D"], "answer": 0 },
                    ...
                ]
                Sadece JSON döndür.
                Başlık: ${title}
                Açıklama: ${description}
            `;

            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                response_format: { type: "json_object" }
            });

            const text = completion.choices[0]?.message?.content || "[]";
            try {
                // Handle potential array wrapper or extra text
                const quiz = JSON.parse(text);
                return NextResponse.json({ quiz: quiz.questions || quiz });
            } catch (e) {
                return NextResponse.json({ error: "AI Error" }, { status: 500 });
            }
        }

        if (action === 'UPDATE_QUIZ') {
            const { moduleId, quizData } = body;
            const updated = await (prisma as any).lmsModule.update({
                where: { id: moduleId },
                data: { quizData }
            });
            return NextResponse.json(updated);
        }
    }

    // STAFF ACTIONS
    if (action === 'COMPLETE') {
        const { moduleId, score } = body;
        const completion = await (prisma as any).lmsCompletion.create({
            data: {
                userId: session.id as string,
                moduleId,
                score: parseInt(score) || 100,
                isCompleted: true
            }
        });

        // Add points to user
        const module = await (prisma as any).lmsModule.findUnique({ where: { id: moduleId } });
        await (prisma as any).user.update({
            where: { id: session.id as string },
            data: { points: { increment: module?.points || 10 } }
        });

        return NextResponse.json(completion);
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });
}
