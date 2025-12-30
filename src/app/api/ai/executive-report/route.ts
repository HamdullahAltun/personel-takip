import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { groq } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// GET: Retrieve the latest cached report from DB
export async function GET() {
    try {
        const session = await getAuth();
        if (!session || (session.role !== 'EXECUTIVE' && session.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const latestReport = await prisma.systemReport.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (!latestReport) {
            return NextResponse.json({ report: null });
        }

        return NextResponse.json({ report: latestReport.content, createdAt: latestReport.createdAt });

    } catch (error) {
        console.error("Error fetching report:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Trigger AI generation and save to DB
export async function POST() {
    try {
        const session = await getAuth();
        if (!session || (session.role !== 'EXECUTIVE' && session.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Gather ALL Data
        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: {
                id: true,
                name: true,
                tasksReceived: true,
                expenses: true,
                attendance: { take: 10, orderBy: { timestamp: 'desc' } }
            }
        });

        const messages = await prisma.message.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: { content: true, sender: { select: { name: true } } }
        });

        const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
        const expensesTotal = await prisma.expense.aggregate({
            _sum: { amount: true },
            where: { status: 'APPROVED' }
        });

        // 2. Prepare Context for AI
        const context = `
            Act as a Senior Business Consultant. Analyze this company data and provide a report in TURKISH language.
            
            IMPORTANT: Return ONLY a valid JSON object. Do not include any other text, markdown formatting, or explanations outside the JSON.
            
            Staff Data Summary:
            ${staff.map((s: any) => `- ${s.name}: ${s.tasksReceived?.filter((t: any) => t.status === 'COMPLETED').length || 0} tasks done. Last Check-in: ${s.attendance?.[0]?.timestamp || 'None'}`).join('\n')}

            Recent Communications (Analyze tone/sentiment):
            ${messages.map((m: any) => `"${m.content}"`).join('\n')}

            Financials:
            Total Approved Expenses: ${expensesTotal._sum.amount || 0}
            Pending Leave Requests: ${pendingLeaves}

            Required JSON Structure:
            {
                "summary": "1-2 sentences overall health summary in Turkish",
                "score": 85,
                "details": {
                    "attendance": "Analysis of attendance in Turkish",
                    "tasks": "Analysis of task performance in Turkish",
                    "expenses": "Analysis of expenses in Turkish",
                    "communication": "Analysis of communication tone/culture in Turkish"
                },
                "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
                "risks": ["Risk 1", "Risk 2", "Risk 3"]
            }
        `;

        // 3. Generate Content
        const client = groq;
        if (!client) throw new Error("AI Model not initialized (API Key missing)");

        const completion = await client.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant that outputs only valid JSON." },
                { role: "user", content: context }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Lower temperature for more consistent JSON
        });

        let text = completion.choices[0]?.message?.content || "";

        // 4. Parse JSON (Robust cleaning)
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        let reportData;
        try {
            reportData = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parse Error:", text);
            throw new Error("Failed to parse AI response");
        }

        // 5. Save to DB
        await prisma.systemReport.create({
            data: {
                content: reportData
            }
        });

        return NextResponse.json({ report: reportData });

    } catch (error: any) {
        console.error("AI Report Generation Error:", error);
        // Handle Rate Limit specifically
        if (error.message?.includes('429') || error.status === 429) {
            return NextResponse.json({ error: "AI Kotası aşıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
        }
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
