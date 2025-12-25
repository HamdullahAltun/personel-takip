import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// Force dynamic behavior
export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                achievements: { orderBy: { date: 'desc' } },
                employeeOfTheMonths: { orderBy: { createdAt: 'desc' } }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is currently working (last attendance is CHECK_IN and today)
        const lastAttendance = await prisma.attendanceRecord.findFirst({
            where: { userId: id },
            orderBy: { timestamp: 'desc' },
        });

        // Simple "Is Working" logic: Last record is CHECK_IN and it was within last 14 hours
        let isWorking = false;
        if (lastAttendance && lastAttendance.type === 'CHECK_IN') {
            const now = new Date();
            const diff = now.getTime() - new Date(lastAttendance.timestamp).getTime();
            if (diff < 14 * 60 * 60 * 1000) { // 14 hours
                isWorking = true;
            }
        }

        // Ensure sensitive data is not returned to other staff
        const safeUser = {
            id: user.id,
            name: user.name,
            role: user.role,
            phone: user.phone, // Maybe need, maybe hide?
            achievements: user.achievements,
            employeeOfTheMonths: user.employeeOfTheMonths,
            isWorking,
            createdAt: user.createdAt
        };

        return NextResponse.json(safeUser);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
