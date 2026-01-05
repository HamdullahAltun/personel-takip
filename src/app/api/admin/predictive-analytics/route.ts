import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { groq } from '@/lib/ai';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'ATTRITION'; // ATTRITION or PERFORMANCE

    const client = groq;
    if (!client) return NextResponse.json({ error: "Groq not configured" }, { status: 500 });

    try {
        // Fetch extended user data
        const users = await prisma.user.findMany({
            where: { role: 'STAFF' },
            include: {
                attendance: { take: 30, orderBy: { timestamp: 'desc' } },
                reviewsReceived: { take: 3, orderBy: { createdAt: 'desc' } },
                leaves: { take: 5, orderBy: { createdAt: 'desc' } },
                tasksReceived: { take: 10, orderBy: { createdAt: 'desc' } },
                achievements: { take: 5 }
            }
        });

        const staffData = users.map((u: any) => ({
            id: u.id,
            name: u.name,
            points: u.points,
            avgWorkHours: 8, // Mock
            latenessCount: u.attendance.filter((a: any) => a.isLate).length,
            lastSafetyStatus: u.safetyStatus,
            taskCompletionRate: u.tasksReceived.filter((t: any) => t.status === 'COMPLETED').length / (u.tasksReceived.length || 1),
            perfScores: u.reviewsReceived.map((p: any) => p.score),
            lastLeave: u.leaves[0]?.startDate
        }));

        let prompt = "";

        if (type === 'PERFORMANCE') {
            prompt = `
            ANALYZE: Identify top 3 "Employee of the Month" candidates based on data.
            DATA: ${JSON.stringify(staffData)}
            
            OUTPUT JSON: { results: [{ name: string, score: number (0-100), reason: string, keyStrength: string }] }
            `;
        } else {
            prompt = `
            ANALYZE: Identify top 3 staff with highest attrition risk (quitting). Consider low task completion, high lateness, low scores.
            DATA: ${JSON.stringify(staffData)}
            
            OUTPUT JSON: { results: [{ name: string, riskLevel: number (0-100), reason: string, retentionPlan: string (one sentence advice) }] }
            `;
        }

        const completion = await client.chat.completions.create({
            messages: [{ role: "system", content: "Expert HR Data Analyst." }, { role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
        return NextResponse.json(analysis);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
