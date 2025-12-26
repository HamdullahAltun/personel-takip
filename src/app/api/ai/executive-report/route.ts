import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { model } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'EXECUTIVE') {
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
        const context = `
            Analyze this company data acting as a Senior Business Consultant.
            
            Staff Data Summary:
            ${staff.map(s => `- ${s.name}: ${s.tasksReceived.filter((t: any) => t.status === 'COMPLETED').length} tasks done. Last Check-in: ${s.attendance[0]?.timestamp || 'None'}`).join('\n')}

            Recent Communications (Analyze tone/sentiment):
            ${messages.map(m => `"${m.content}"`).join('\n')}

            Financials:
            Total Approved Expenses: ${expensesTotal._sum.amount || 0}
            Pending Leave Requests: ${pendingLeaves}

            Task: Provide a JSON report with:
            1. summary (1-2 sentences overall health)
            2. score (0-100 integer)
            3. details object with keys: attendance, tasks, expenses, communication (each a paragraph analysis)
            4. recommendations (array of 3 strings)
            5. risks (array of 3 strings, identify any toxic behavior or slackers)
        `;

        // 3. Generate Content
        if (!model) throw new Error("AI Model not initialized");

        const result = await model.generateContent(context);
        const response = result.response;
        let text = response.text();

        // 4. Parse JSON (Handle potential markdown code blocks)
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const report = JSON.parse(text);

        return NextResponse.json({ report });

    } catch (error: any) {
        console.error("AI Report Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
