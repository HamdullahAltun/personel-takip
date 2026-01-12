import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { subDays, startOfMonth } from "date-fns";
import { groq } from "@/lib/ai";

export async function GET() {
    return generateReport();
}

export async function POST() {
    return generateReport();
}

async function generateReport() {
    try {
        // 1. Fetch Key Data Points
        const [
            users,
            recentAttendance,
            departments,
            pendingLeaves,
            expenses,
            sentimentLogs,
            attritionRisks
        ] = await Promise.all([
            prisma.user.findMany({ select: { id: true, role: true, name: true } }),
            prisma.attendanceRecord.findMany({ where: { timestamp: { gte: subDays(new Date(), 30) } } }),
            prisma.department.findMany(),
            prisma.leaveRequest.count({ where: { status: "PENDING" } }),
            prisma.expense.findMany({ where: { date: { gte: subDays(new Date(), 30) }, status: 'APPROVED' } }),
            prisma.sentimentLog.findMany({ where: { createdAt: { gte: subDays(new Date(), 30) } }, take: 50 }),
            prisma.attritionRisk.findMany({ orderBy: { riskScore: 'desc' }, take: 10, include: { user: { select: { name: true } } } })
        ]);

        // 2. Prepare Data for AI
        const totalStaff = users.filter(u => u.role === "STAFF").length;
        const totalBudget = departments.reduce((acc, d) => acc + d.budgetLimit, 0);
        const totalSpent = departments.reduce((acc, d) => acc + d.budgetUsed, 0);
        const lateCount = recentAttendance.filter(r => r.isLate).length;
        const avgSentiment = sentimentLogs.length > 0
            ? sentimentLogs.reduce((acc, log) => acc + log.score, 0) / sentimentLogs.length
            : 0;

        const dataSummary = {
            companyStats: {
                totalStaff,
                totalBudget,
                totalSpent,
                budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget * 100).toFixed(1) + '%' : '0%',
                pendingLeaves,
                totalApprovedExpensesLast30Days: expenses.reduce((acc, e) => acc + e.amount, 0)
            },
            attendance: {
                totalRecords: recentAttendance.length,
                lateCount,
                lateRate: recentAttendance.length > 0 ? (lateCount / recentAttendance.length * 100).toFixed(1) + '%' : '0%'
            },
            sentiment: {
                averageScore: avgSentiment.toFixed(2), // -1 to 1
                // @ts-ignore
                recentComments: sentimentLogs.map(l => l.metadata && (l.metadata as any).content).filter(Boolean).slice(0, 5)
            },
            highRiskEmployees: attritionRisks.map(r => ({ name: r.user.name, score: r.riskScore }))
        };

        // 3. AI Analysis with Groq
        if (!groq) {
            // Fallback if AI is missing (should not happen in this env)
            return NextResponse.json({ report: { summary: "Heuristic Fallback", score: 80, details: {}, recommendations: [], risks: [] } });
        }

        const systemPrompt = `
        Sen bir Üst Düzey Şirket Analistisin (Executive Analyst). 
        Sana verilen şirket verilerini analiz et ve bir yönetici özeti (Executive Summary) oluştur.
        
        KURALLAR:
        1. JSON formatında dön: { summary: string (30 kelime max), score: number (0-100), details: { attendance: string, tasks: string, expenses: string, communication: string }, recommendations: string[], risks: string[] }
        2. Dil: Türkçe.
        3. Score (Şirket Sağlık Puanı): Bütçe kullanımı, geç kalma oranı ve istifa risklerine göre objektif bir puan ver.
        4. Profesyonel ve stratejik bir ton kullan.
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: JSON.stringify(dataSummary) }
            ],
            model: "llama-3.1-70b-versatile",
            response_format: { type: "json_object" }
        });

        const report = JSON.parse(completion.choices[0]?.message?.content || "{}");

        return NextResponse.json({ report });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
