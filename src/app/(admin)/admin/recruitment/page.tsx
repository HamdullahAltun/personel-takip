"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, Briefcase, Users, Sparkles, MoreVertical } from "lucide-react";
import CandidateCard from "./components/CandidateCard";

export default function RecruitmentPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, new: 0, hired: 0 });
    const [loading, setLoading] = useState(true);

    const fetchCandidates = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/recruitment');
        if (res.ok) {
            const data = await res.json();
            setCandidates(data);

            // Calculate stats
            setStats({
                total: data.length,
                new: data.filter((c: any) => c.status === 'NEW').length,
                hired: data.filter((c: any) => c.status === 'HIRED').length
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const columns = [
        { id: 'NEW', title: 'Yeni Başvuru', color: 'bg-blue-50 text-blue-700 border-blue-100' },
        { id: 'INTERVIEW', title: 'Mülakat', color: 'bg-purple-50 text-purple-700 border-purple-100' },
        { id: 'OFFER', title: 'Teklif', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        { id: 'HIRED', title: 'İşe Alındı', color: 'bg-green-50 text-green-700 border-green-100' },
        { id: 'REJECTED', title: 'Reddedildi', color: 'bg-slate-50 text-slate-700 border-slate-100' }
    ];

    if (loading && candidates.length === 0) {
        return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.24))] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-indigo-600" />
                        İşe Alım & ATS
                    </h1>
                    <p className="text-slate-500 text-sm">Aday takip sistemi ve yapay zeka destekli analiz</p>
                </div>

                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 text-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Toplam Aday</span>
                            <span className="font-bold text-slate-900">{stats.total}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Yeni</span>
                            <span className="font-bold text-blue-600">{stats.new}</span>
                        </div>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-200">
                        <Plus className="h-5 w-5" /> Aday Ekle
                    </button>
                </div>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-max h-full">
                    {columns.map(col => {
                        const colCandidates = candidates.filter(c => c.status === col.id);
                        return (
                            <div key={col.id} className="w-80 flex flex-col shrink-0">
                                {/* Column Header */}
                                <div className={`flex items-center justify-between p-3 rounded-xl border mb-3 ${col.color}`}>
                                    <span className="font-bold text-sm">{col.title}</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded-lg text-xs font-black">{colCandidates.length}</span>
                                </div>

                                {/* Cards */}
                                <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-200/50 p-2 space-y-3 overflow-y-auto">
                                    {colCandidates.length > 0 ? (
                                        colCandidates.map(c => (
                                            <CandidateCard key={c.id} candidate={c} onRefresh={fetchCandidates} />
                                        ))
                                    ) : (
                                        <div className="h-32 flex items-center justify-center text-slate-300 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">
                                            Aday yok
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
