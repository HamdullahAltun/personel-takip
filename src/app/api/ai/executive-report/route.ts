import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { model } from '@/lib/ai';

export const dynamic = 'force-dynamic';

try {
    const session = await getAuth();
    // Allow access to Executives AND Admins
    if (!session || (session.role !== 'EXECUTIVE' && session.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Gather ALL Data (carefully limited)
    const staff = await prisma.user.findMany({
        where: { role: 'STAFF' },
        select: { id: true, name: true, tasksReceived: true, expenses: true, attendance: { take: 10, orderBy: { timestamp: 'desc' } } }
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
    // 2. Prepare Context for AI
    const context = `
            Act as a Senior Business Consultant. Analyze this company data and provide a report in TURKISH language.
            
            IMPORTANT: Return ONLY a valid JSON object. Do not include any other text, markdown formatting, or explanations outside the JSON.
            
            Staff Data Summary:
            ${staff.map(s => `- ${s.name}: ${s.tasksReceived.filter((t: any) => t.status === 'COMPLETED').length} tasks done. Last Check-in: ${s.attendance[0]?.timestamp || 'None'}`).join('\n')}

            Recent Communications (Analyze tone/sentiment):
            ${messages.map(m => `"${m.content}"`).join('\n')}

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
    if (!model) throw new Error("AI Model not initialized");

    const result = await model.generateContent(context);
    const response = result.response;
    let text = response.text();

    // 4. Parse JSON (Robust cleaning)
    // Find the first { and the last }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    const report = JSON.parse(text);

    return NextResponse.json({ report });

} catch (error: any) {
    console.error("AI Report Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
}
}
