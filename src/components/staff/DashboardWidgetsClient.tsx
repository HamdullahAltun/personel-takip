"use client";

import AnnouncementWidget from "@/components/staff/AnnouncementWidget";
import EOMWidget from "@/components/staff/EOMWidget";
import useSWR from "swr";

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
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardWidgets() {
    const { data } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true
    });

    if (!data) return <div className="animate-pulse bg-slate-200 h-32 rounded-xl"></div>;

    return (
        <div className="grid grid-cols-1 gap-4">
            <AnnouncementWidget announcement={data.announcement} />
            <EOMWidget data={data.eom} />
        </div>
    );
}
