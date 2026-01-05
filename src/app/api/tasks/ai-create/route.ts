import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
        }

        if (!groq) {
            return NextResponse.json({ error: 'AI config missing' }, { status: 500 });
        }

        const prompt = `
        Act as a project manager. Expand this short task request into a detailed task definition.
        INPUT: "${text}"

        OUTPUT JSON format:
        {
            "title": "Professional Title",
            "description": "Detailed description of what needs to be done...",
            "priority": "MEDIUM" (or HIGH/URGENT/LOW based on context),
            "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"]
        }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return NextResponse.json(data);

    } catch (e: any) {
        console.error("AI Task Error:", e);
        return NextResponse.json({ error: e.message || 'Error processing request' }, { status: 500 });
    }
}
