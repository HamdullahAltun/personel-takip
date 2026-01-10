"use client";

import FieldTaskMap from "@/components/staff/FieldTaskMap";

export default function FieldTasksPage() {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saha Görevleri</h1>
                <p className="text-slate-500 text-sm font-medium">Harita üzerinden görevlerinizi takip edin.</p>
            </div>

            <div className="flex-1 min-h-0">
                <FieldTaskMap />
            </div>
        </div>
    );
}
