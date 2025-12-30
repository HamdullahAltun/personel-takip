
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Genel Bakış",
};

export const dynamic = 'force-dynamic';

import AutoRefresh from "@/components/AutoRefresh";
import DashboardStats from "@/components/DashboardStats";
import LiveOfficeMap from "@/components/LiveOfficeMap";
import PendingApprovals from "@/components/PendingApprovals";
import WeeklyAttendanceChart from "@/components/WeeklyAttendanceChart";
import RecentActivityList from "@/components/RecentActivityList";
import DetailedExecutiveReport from "@/components/DetailedExecutiveReport";

export default async function AdminDashboard() {
    // 1. Recent Activity (Server Side)
    const recentActivity = await prisma.attendanceRecord.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { user: true }
    });

    // 2. Weekly Attendance Data for Chart
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);
    lastWeek.setHours(0, 0, 0, 0);

    const weeklyAttendance = await prisma.attendanceRecord.findMany({
        where: {
            timestamp: { gte: lastWeek },
            type: 'CHECK_IN'
        },
        orderBy: { timestamp: 'asc' }
    });

    const chartData = [];
    const trDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayLabel = trDays[d.getDay()]; // e.g. Çar
        const dayStr = d.toISOString().split('T')[0];

        // Count unique users who checked in this day
        const dailyRecords = weeklyAttendance.filter(r => r.timestamp.toISOString().startsWith(dayStr));
        const uniqueUsers = new Set(dailyRecords.map(r => r.userId));

        chartData.push({
            name: dayLabel,
            katilim: uniqueUsers.size
        });
    }

    return (
        <div className="space-y-8 pb-12">
            <AutoRefresh interval={30000} />
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Genel Bakış</h1>
                    <p className="text-slate-500">Bugünün personel durumu ve istatistikleri</p>
                </div>
                <div className="hidden md:block text-right">
                    <p className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Real-time Stats Client Component */}
            <DashboardStats />

            {/* Charts & Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:h-[400px]">
                <div className="lg:col-span-2 h-[400px] lg:h-full">
                    <WeeklyAttendanceChart data={chartData} />
                </div>
                <div className="lg:col-span-1 h-[400px] lg:h-full">
                    <RecentActivityList activities={recentActivity} />
                </div>
            </div>

            {/* Interactive Approvals Section (Cards) */}
            <PendingApprovals />

            {/* Map & AI */}
            {/* Map */}
            <div className="h-[500px]">
                <LiveOfficeMap />
            </div>

            {/* AI Report Section */}
            <DetailedExecutiveReport />
        </div>
    );
}
