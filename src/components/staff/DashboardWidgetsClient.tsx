"use client";

import { useEffect, useState } from "react";
import AnnouncementWidget from "@/components/staff/AnnouncementWidget";
import EOMWidget from "@/components/staff/EOMWidget";

export default function DashboardWidgets() {
    const [data, setData] = useState<any>({ announcement: null, eom: null });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) { }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 gap-4">
            <AnnouncementWidget announcement={data.announcement} />
            <EOMWidget data={data.eom} />
        </div>
    );
}
