import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = groq;
    if (!client) return NextResponse.json({ error: "Groq not configured" }, { status: 500 });

    try {
        const { image } = await req.json(); // base64 image

        const completion = await client.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Bu bir gider fişi/faturasıdır. Lütfen fiş üzerinden şu verileri JSON formatında çıkar: { amount: number, date: string (YYYY-MM-DD), description: string, category: string (Food, Travel, Equipment, Office, Other) }. Sadece JSON döndür." },
                        { type: "image_url", image_url: { url: image } }
                    ]
                }
            ],
            model: "llama-3.2-11b-vision-preview",
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("OCR Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
