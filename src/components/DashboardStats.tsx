
"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, AlertCircle, Clock, Briefcase, Calendar, FileText, UserPlus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardStats() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeCount: 0,
        lateCount: 0,
        pendingTotal: 0,
        activeVisitors: 0,
        newCandidates: 0,
        todayBookings: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Stats fetch error", error);
            }
        };

        fetchStats(); // Initial
        const interval = setInterval(fetchStats, 5000); // Every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Total Personnel */}
            <div className="bg-blue-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-blue-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-600">
                        <Users className="h-6 w-6" />
                    </div>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.totalEmployees}</h3>
                    <p className="text-slate-500 font-medium">Toplam Personel</p>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-6 -right-6 text-blue-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Users className="h-32 w-32" />
                </div>
            </div>

            {/* 2. Active in Office */}
            <div className="bg-green-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-green-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-green-600">
                        <UserCheck className="h-6 w-6" />
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                        {stats.totalEmployees > 0 ? Math.round((stats.activeCount / stats.totalEmployees) * 100) : 0}% katılım
                    </span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.activeCount}</h3>
                    <p className="text-slate-500 font-medium">Şu An Ofiste</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-green-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <UserCheck className="h-32 w-32" />
                </div>
            </div>

            {/* 3. Late Arrivals */}
            <div className="bg-amber-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-amber-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-amber-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">Bugün</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.lateCount}</h3>
                    <p className="text-slate-500 font-medium">Geç Kalanlar</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-amber-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Clock className="h-32 w-32" />
                </div>
            </div>

            {/* 4. Pending Actions */}
            <div className="bg-indigo-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-indigo-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600">
                        <Info className="h-6 w-6" />
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">İzin & Harcama</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.pendingTotal}</h3>
                    <p className="text-slate-500 font-medium">Bekleyen İşlemler</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-indigo-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Info className="h-32 w-32" />
                </div>
            </div>

            {/* 5. Instant Visitors */}
            <div className="bg-pink-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-pink-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-pink-600">
                        <Users className="h-6 w-6" />
                    </div>
                    <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full">Şu an ofiste</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.activeVisitors}</h3>
                    <p className="text-slate-500 font-medium">Anlık Ziyaretçi</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-pink-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Users className="h-32 w-32" />
                </div>
            </div>

            {/* 6. Job Applications */}
            <div className="bg-cyan-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-cyan-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-cyan-600">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2 py-1 rounded-full">Değerlendirilecek</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.newCandidates}</h3>
                    <p className="text-slate-500 font-medium">İş Başvurusu</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-cyan-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Briefcase className="h-32 w-32" />
                </div>
            </div>

            {/* 7. Today Reservations */}
            <div className="bg-violet-50/50 p-6 rounded-[2rem] relative overflow-hidden group hover:shadow-lg transition-all border border-violet-100 md:col-span-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-violet-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-1 rounded-full">Toplantı & Araç</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-slate-900 mb-1">{stats.todayBookings}</h3>
                    <p className="text-slate-500 font-medium">Bugünkü Rezervasyon</p>
                </div>
                <div className="absolute -bottom-6 -right-6 text-violet-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <Calendar className="h-32 w-32" />
                </div>
            </div>
        </div>
    );
}

