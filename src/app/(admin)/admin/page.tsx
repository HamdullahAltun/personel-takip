import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
import { startOfDay, subDays, format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
    const today = startOfDay(new Date());
    const lastWeek = subDays(today, 6);

    // 1. Basic Counts
    const totalStaff = await prisma.user.count({ where: { role: 'STAFF' } });

    // Who is in office NOW? (Last record is CHECK_IN)
    // This is tricky in simple query, fetching all and filtering in JS is easier for small/medium teams
    const allStaff = await prisma.user.findMany({
        where: { role: 'STAFF' },
        include: {
            attendance: {
                orderBy: { timestamp: 'desc' },
                take: 1
            }
        }
    });

    const activeStaffCount = allStaff.filter(u => u.attendance[0]?.type === 'CHECK_IN').length;
    const lateCount = allStaff.filter(u => u.attendance[0]?.isLate && u.attendance[0]?.timestamp >= today).length;

    // 2. Pending Requests
    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const pendingExpenses = await prisma.expense.count({ where: { status: 'PENDING' } });

    // 3. Weekly Attendance Data for Chart
    // Fetch all check-ins from last 7 days
    const weeklyAttendance = await prisma.attendanceRecord.findMany({
        where: {
            timestamp: { gte: lastWeek },
            type: 'CHECK_IN'
        },
        orderBy: { timestamp: 'asc' }
    });

    // Group by day
    const chartData = [];
    for (let i = 0; i < 7; i++) {
        const d = subDays(new Date(), 6 - i);
        const dayStr = format(d, 'yyyy-MM-dd');
        const displayDay = format(d, 'EEE', { locale: tr }); // Pzt, Sal...

        const count = weeklyAttendance.filter(a => format(a.timestamp, 'yyyy-MM-dd') === dayStr).length;
        // Mocking 'expected' based on total staff (assuming all should come)
        chartData.push({
            name: displayDay,
            katilim: count,
            beklenen: totalStaff
        });
    }

    // 4. Recent Activities
    const recentActivities = await prisma.attendanceRecord.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { name: true, role: true, profilePicture: true } } }
    });

    // 5. New Modules Stats
    const activeVisitors = await prisma.visitor.count({ where: { exitTime: null } });
    const newCandidates = await prisma.candidate.count({ where: { status: 'NEW' } });
    const todayBookings = await prisma.booking.count({
        where: {
            startTime: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        }
    });

    return {
        stats: {
            totalStaff,
            activeStaffCount,
            lateCount,
            pendingLeaves,
            pendingExpenses,
            absentToday: totalStaff - activeStaffCount,
            activeVisitors,
            newCandidates,
            todayBookings
        },
        chartData,
        recentActivities: recentActivities.map(a => ({
            id: a.id,
            user: a.user.name,
            avatar: a.user.profilePicture,
            type: a.type,
            time: format(a.timestamp, 'HH:mm'),
            isLate: a.isLate
        }))
    };
}

export default async function AdminDashboardPage() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        redirect('/login');
    }

    const data = await getDashboardData();

    return <AdminDashboardClient data={data} role={session.role} />;
}
