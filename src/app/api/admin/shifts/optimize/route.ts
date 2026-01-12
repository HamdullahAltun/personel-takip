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
            Act as an expert Workforce Scheduler for a company. 
            Create an optimal shift schedule for 1 week starting ${format(start, 'yyyy-MM-dd')} (Monday) to ${format(end, 'yyyy-MM-dd')} (Sunday).
            
            Staff List (ID, Name, Weekly Hour Goal):
            ${JSON.stringify(staff)}

            Unavailable Staff (Approved Leave Requests):
            ${JSON.stringify(unavailableStaff)}

            Business Rules:
            - Shift Slots: 
               - Morning: 08:00 to 16:00
               - Evening: 16:00 to 00:00
               - Night: 00:00 to 08:00
            - Staff Requirements:
               - Morning Shift: Min ${constraints.minStaffDay || 3} staff
               - Evening Shift: Min ${constraints.minStaffPeak || 3} staff
               - Night Shift: Min ${constraints.minStaffNight || 1} staff
            - Maximum Working Hours per Staff per Week: ${constraints.maxHoursPerEmployee || 45} hours.
            - Rest period: Staff MUST have at least 8 hours of rest between shifts. They cannot work two consecutive shifts (e.g., cannot work Evening then Night).
            - Leaves: Do NOT assign staff on days they have approved leave.
            
            OUTPUT FORMAT (Strict JSON):
            {
              "shifts": [
                { 
                  "userId": "staff-mongodb-id", 
                  "userName": "Staff Name", 
                  "date": "YYYY-MM-DD", 
                  "startTime": "HH:mm", 
                  "endTime": "HH:mm", 
                  "type": "REGULAR" 
                }
              ]
            }
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

        // Standardize output to always be an array of shifts
        const shifts = result.shifts || (Array.isArray(result) ? result : []);

        return NextResponse.json({ success: true, shifts });

    } catch (e: any) {
        console.error("Shift Optimization Failed", e);
        return NextResponse.json({ error: e.message || "Optimization failed" }, { status: 500 });
    }
}
