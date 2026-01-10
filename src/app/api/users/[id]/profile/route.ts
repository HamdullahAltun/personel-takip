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

        const isAuthorizedToViewDetails = session.role === 'EXECUTIVE' || session.role === 'ADMIN';

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                achievements: { orderBy: { date: 'desc' } },
                employeeOfTheMonths: { orderBy: { createdAt: 'desc' } },
                // Conditional includes aren't directly supported like this easily in one query object definition unless tailored
                // So we'll fetch basic first, OR just fetch everything but filter in response?
                // Better to build the include object dynamically.
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let extensiveData: Record<string, unknown> = {};
        if (isAuthorizedToViewDetails) {
            const details = await prisma.user.findUnique({
                where: { id },
                select: {
                    tasksReceived: { orderBy: { createdAt: 'desc' }, take: 20 },
                    expenses: { orderBy: { date: 'desc' }, take: 20 },
                    leaves: { orderBy: { startDate: 'desc' }, take: 10 },
                    shifts: {
                        where: { startTime: { gte: new Date() } },
                        orderBy: { startTime: 'asc' },
                        take: 10
                    },
                    attendance: { orderBy: { timestamp: 'desc' }, take: 30 }
                }
            });
            if (details) extensiveData = details;
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
            phone: user.phone,
            profilePicture: user.profilePicture, // Include profile picture
            achievements: user.achievements,
            employeeOfTheMonths: user.employeeOfTheMonths,
            isWorking,
            createdAt: user.createdAt,
            ...(isAuthorizedToViewDetails ? extensiveData : {}) // Spread extensive data if authorized
        };

        return NextResponse.json(safeUser);

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
