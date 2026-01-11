"use client";

import { useState, useEffect } from "react";
import { Zap, Activity, Users } from "lucide-react";

export default function ProductivityPage() {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/analytics/productivity').then(res => res.json()).then(setData);
    }, []);

    if (!data) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum']; // Work days only for simpler view

    const getColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-slate-50';
            case 1: return 'bg-indigo-100';
            case 2: return 'bg-indigo-300';
            case 3: return 'bg-indigo-500';
            case 4: return 'bg-indigo-700';
            default: return 'bg-slate-50';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-3 rounded-xl text-white shadow-lg shadow-orange-200">
                    <Zap className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Üretkenlik Analizi</h1>
                    <p className="text-slate-500 text-xs">Takım çalışma yoğunluğu ve performansı.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Heatmap */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-x-auto">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-500" />
                        Çalışma Yoğunluk Haritası
                    </h3>

                    <div className="min-w-[500px]">
                        <div className="flex mb-2">
                            <div className="w-16"></div>
                            {days.map(d => (
                                <div key={d} className="flex-1 text-center text-xs font-bold text-slate-400">{d}</div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {data.heatmap.map((row: any) => (
                                <div key={row.hour} className="flex items-center gap-2">
                                    <div className="w-16 text-xs font-bold text-slate-400 text-right pr-2">{row.hour}</div>
                                    {days.map(d => {
                                        // Map simple day names to data keys logic if needed, assumes data keys match or closer
                                        // API returns Pzt, Sal etc.
                                        const val = row[d] || 0;
                                        return (
                                            <div
                                                key={d}
                                                className={`flex-1 h-8 rounded-lg transition hover:opacity-80 ${getColor(val)}`}
                                                title={`${row.hour} ${d}: Yoğunluk ${val}`}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-500" />
                        Haftanın Yıldızları
                    </h3>

                    <div className="space-y-4">
                        {data.topPerformers.map((user: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                    {user.profilePicture ? (
                                        <img src={user.profilePicture} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{user.name[0]}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-700 text-sm">{user.name}</h4>
                                    <p className="text-[10px] text-slate-400">{user.department?.name || 'Genel'}</p>
                                </div>
                                <div className="font-mono font-bold text-indigo-600 text-sm">{user.points} P</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
