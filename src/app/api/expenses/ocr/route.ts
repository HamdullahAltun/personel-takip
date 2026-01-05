import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!groq) {
            return NextResponse.json({ error: 'AI config missing' }, { status: 500 });
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Extract expense data from this receipt. Return ONLY JSON: { description: string, amount: number, date: string (YYYY-MM-DD), category: string (Food, Travel, Equipment, Other) }"
                        },
                        {
                            type: "image_url",
                            image_url: { url: imageUrl }
                        }
                    ]
                }
            ],
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return NextResponse.json(data);

    } catch (e: any) {
        console.error("OCR Error:", e);
        return NextResponse.json({ error: e.message || 'Error processing image' }, { status: 500 });
    }
}
