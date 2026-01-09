import { NextResponse } from 'next/server';
import { generatePostContent, generatePollOptions } from '@/lib/ai';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { action, prompt, type } = await req.json();

        if (action === 'GENERATE_POST') {
            const content = await generatePostContent(prompt, type || 'PROFESSIONAL');
            return NextResponse.json({ content });
        }

        if (action === 'GENERATE_POLL') {
            const options = await generatePollOptions(prompt);
            return NextResponse.json({ options });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 });
    }
}
