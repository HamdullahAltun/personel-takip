import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { groq } from '@/lib/ai';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { startDate, constraints } = body;

        if (!groq) {
            return NextResponse.json({ error: "AI Service Unavailable" }, { status: 503 });
        }

        const start = new Date(startDate);
        const end = addDays(start, 6);

        // 1. Fetch Eligible Staff
        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: { id: true, name: true, weeklyGoal: true }
        });

        // 2. Fetch Leave Requests (Approved)
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED',
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }
                ]
            }
        });

        // Map leaves to simplified format
        const unavailableStaff = leaves.map(l => ({
            userId: l.userId,
            start: format(l.startDate, 'yyyy-MM-dd'),
            end: format(l.endDate, 'yyyy-MM-dd')
        }));

        // 3. Construct Prompt
        const prompt = `
            Act as an expert Workforce Scheduler. Create an optimal shift schedule for 1 week starting ${format(start, 'yyyy-MM-dd')}.
            
            Staff List (ID, Name, Weekly Hour Goal):
            ${JSON.stringify(staff)}

            Unavailable Staff (Leave Requests):
            ${JSON.stringify(unavailableStaff)}

            Constraints:
            - Shifts: 08:00-16:00 (Morning), 16:00-24:00 (Evening), 00:00-08:00 (Night).
            - Min Staff per Shift: Morning=${constraints.minStaffDay || 3}, Evening=${constraints.minStaffPeak || 3}, Night=${constraints.minStaffNight || 1}.
            - Max Hours Per Employee: ${constraints.maxHoursPerEmployee || 45}.
            - Do NOT assign staff who are on leave.
            - Staff cannot work 2 consecutive shifts.
            - Staff cannot work more than Max Hours.
            
            Output strictly a JSON array of objects:
            [
              { "userId": "...", "userName": "...", "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm", "type": "AUTO_GENERATED" }
            ]
        `;

        // 4. AI Generation
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        const result = JSON.parse(content);

        // Handle if AI returns object with key "shifts" or just array
        const shifts = Array.isArray(result) ? result : (result.shifts || []);

        return NextResponse.json({ success: true, shifts });

    } catch (e: any) {
        console.error("Shift Optimization Failed", e);
        return NextResponse.json({ error: e.message || "Optimization failed" }, { status: 500 });
    }
}
