"use client";

import AnnouncementWidget from "@/components/staff/AnnouncementWidget";
import EOMWidget from "@/components/staff/EOMWidget";
import WeeklyActivityChart from "@/components/staff/WeeklyActivityChart";
import useSWR from "swr";
import { BarChart3 } from "lucide-react";

interface DashboardStats {
    announcement: {
        id: string;
        title: string;
        content: string;
        createdAt: Date;
    } | null;
    eom: {
        user: { name: string };
        note: string | null;
        month: number;
        year: number;
    } | null;
    weeklyActivity: {
        day: string;
        hours: number;
        fullDate: string;
    }[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardWidgets() {
    const { data } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true
    });

    if (!data) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="h-4 w-24 bg-slate-100 rounded-full mb-4 animate-pulse" />
                    <div className="h-8 w-3/4 bg-slate-100 rounded-xl mb-3 animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-100 rounded-xl animate-pulse" />
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 h-64 animate-pulse border border-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AnnouncementWidget announcement={data.announcement} />

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Haftalık Aktivite</h3>
                        <p className="text-xs text-slate-500 font-medium">Günlük çalışma saatleri</p>
                    </div>
                </div>
                <WeeklyActivityChart data={data.weeklyActivity} />
            </div>

            <EOMWidget data={data.eom} />
        </div>
    );
}
