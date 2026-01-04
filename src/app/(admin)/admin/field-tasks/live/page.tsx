"use client";

import LiveMap from "@/components/admin/LiveMap";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LiveMapPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/field-tasks" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Canlı Takip Haritası</h1>
                    <p className="text-slate-500">Personel konumlarını harita üzerinde görüntüleyin.</p>
                </div>
            </div>

            <LiveMap />
        </div>
    );
}
