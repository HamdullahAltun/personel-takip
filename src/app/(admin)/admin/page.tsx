
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
import PredictiveAttritionWidget from "@/components/PredictiveAttritionWidget";
import BudgetOverviewWidget from "@/components/BudgetOverviewWidget";

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

            {/* Dashboard Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* 2/4 Charts */}
                <div className="lg:col-span-2 h-[400px]">
                    <WeeklyAttendanceChart data={chartData} />
                </div>

                {/* 1/4 Risk Analysis */}
                <div className="lg:col-span-1 h-[400px]">
                    <PredictiveAttritionWidget />
                </div>

                {/* 1/4 Budget Tracking */}
                <div className="lg:col-span-1 h-[400px]">
                    <BudgetOverviewWidget />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <PendingApprovals />
                </div>
                <div className="lg:col-span-1">
                    <RecentActivityList activities={recentActivity} />
                </div>
            </div>

            {/* AI Report Section */}
            <DetailedExecutiveReport />

            {/* Map */}
            <div className="h-[500px]">
                <LiveOfficeMap />
            </div>
        </div>
    );
}
