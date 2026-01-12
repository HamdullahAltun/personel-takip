import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { shifts } = body;

        if (!shifts || !Array.isArray(shifts)) {
            return NextResponse.json({ error: "Invalid shifts data" }, { status: 400 });
        }

        // Batch create shifts
        const createdShifts = await Promise.all(
            shifts.map((s: any) => {
                const start = new Date(`${s.date}T${s.startTime}`);
                let end = new Date(`${s.date}T${s.endTime}`);

                // Handle shifts crossing midnight (like 16:00-00:00 or 22:00-06:00)
                if (end <= start) {
                    end.setDate(end.getDate() + 1);
                }

                return prisma.shift.create({
                    data: {
                        userId: s.userId,
                        startTime: start,
                        endTime: end,
                        type: s.type || 'REGULAR',
                        status: 'PUBLISHED',
                        title: s.title || 'AI Generated Shift'
                    }
                });
            })
        );

        return NextResponse.json({ success: true, count: createdShifts.length });

    } catch (error: any) {
        console.error("Shift Batch Create Failed", error);
        return NextResponse.json({ error: error.message || "Failed to save shifts" }, { status: 500 });
    }
}
