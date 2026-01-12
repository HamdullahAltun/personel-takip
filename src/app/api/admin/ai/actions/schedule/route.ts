import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { addDays, format, nextMonday } from 'date-fns';
import { groq } from '@/lib/ai';
import { ShiftType, ShiftStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer timeout for AI generation

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const config = await prisma.aiAutomationConfig.findFirst();

    if (!config || !config.autoScheduleEnabled) {
        return NextResponse.json({ message: 'Otomatik planlama devre dışı. Ayarlardan aktifleştirin.', debug_config: config });
    }

    if (!groq) {
        return NextResponse.json({ error: "AI Service Unavailable (API Key Missing)" }, { status: 503 });
    }

    try {
        await prisma.systemLog.create({
            data: {
                level: 'AI_ACTION',
                message: 'Otomatik vardiya planlayıcı başlatıldı (AI Modu).',
            }
        });

        // 1. Get next week range
        const start = nextMonday(new Date());
        const end = addDays(start, 6);

        // 2. Fetch Eligible Staff
        const staff = await prisma.user.findMany({
            where: { role: 'STAFF' },
            select: { id: true, name: true, weeklyGoal: true }
        });

        // 3. Fetch Leave Requests (Approved)
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'APPROVED',
                OR: [
                    { startDate: { lte: end }, endDate: { gte: start } }
                ]
            }
        });

        // Map unavailable staff
        const unavailableStaff = leaves.map(l => ({
            userId: l.userId,
            start: format(l.startDate, 'yyyy-MM-dd'),
            end: format(l.endDate, 'yyyy-MM-dd')
        }));

        // 4. Construct Prompt
        const prompt = `
            Act as an expert Workforce Scheduler. Create an optimal shift schedule for 1 week starting ${format(start, 'yyyy-MM-dd')}.
            
            Staff List (ID, Name, Weekly Hour Goal):
            ${JSON.stringify(staff)}

            Unavailable Staff (Leave Requests):
            ${JSON.stringify(unavailableStaff)}

            Constraints:
            - Shifts: Morning (${config.operatingHoursStart}-16:00), Evening (16:00-${config.operatingHoursEnd}).
            - Min Staff per Shift: ${config.minStaffPerShift}.
            - Do NOT assign staff who are on leave.
            - Staff cannot work 2 consecutive shifts.
            - Distribute shifts fairly based on Weekly Hour Goal.
            
            output in JSON format:
            {
              "shifts": [
                { "userId": "...", "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm" }
              ]
            }
        `;

        // 5. AI Generation
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0]?.message?.content || "{}";
        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            console.error("AI JSON Parse Error", e);
            throw new Error("AI yanıtı okunamadı.");
        }

        const generatedShifts = result.shifts || [];
        let shiftsCreated = 0;

        // 6. DB Creation
        if (generatedShifts.length > 0) {
            const dataToCreate = generatedShifts.map((s: any) => {
                const shiftStart = new Date(`${s.date}T${s.startTime}`);
                const shiftEnd = new Date(`${s.date}T${s.endTime}`);

                // Basic validation
                if (isNaN(shiftStart.getTime()) || isNaN(shiftEnd.getTime())) return null;

                return {
                    userId: s.userId,
                    startTime: shiftStart,
                    endTime: shiftEnd,
                    type: ShiftType.REGULAR,
                    status: ShiftStatus.PUBLISHED,
                    title: 'AI Scheduled',
                };
            }).filter((s: any) => s !== null);

            if (dataToCreate.length > 0) {
                await prisma.shift.createMany({ data: dataToCreate });
                shiftsCreated = dataToCreate.length;
            }
        }

        await prisma.systemLog.create({
            data: {
                level: 'AI_ACTION',
                message: `AI Planlama tamamlandı. ${shiftsCreated} yeni vardiya oluşturuldu.`,
            }
        });

        return NextResponse.json({ message: `Planlama tamamlandı. ${shiftsCreated} vardiya oluşturuldu.` });

    } catch (e: any) {
        console.error("Schedule Error:", e);
        await prisma.systemLog.create({
            data: {
                level: 'ERROR',
                message: `AI Planlama hatası: ${e.message}`,
            }
        });
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
