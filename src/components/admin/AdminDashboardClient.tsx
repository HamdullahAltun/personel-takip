"use client";

import {
    Users,
    UserCheck,
    Clock,
    AlertCircle,
    TrendingUp,
    Wallet,
    CalendarClock,
    MoreHorizontal,
    Briefcase,
    LucideIcon
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AIExecutiveSummary from "@/components/AIExecutiveSummary";

interface DashboardData {
    stats: {
        totalStaff: number;
        activeStaffCount: number;
        lateCount: number;
        pendingLeaves: number;
        pendingExpenses: number;
        absentToday: number;
        activeVisitors: number;
        newCandidates: number;
        todayBookings: number;
    };
    chartData: { name: string; katilim: number }[];
    recentActivities: { user: string; type: 'CHECK_IN' | 'CHECK_OUT'; time: string; isLate?: boolean }[];
}

export default function AdminDashboardClient({ data }: { data: DashboardData, role: string }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Yönetim Paneli</h1>
                <p className="text-slate-500 mt-1">
                    Hoş geldiniz, bugün şirketinizde neler olduğunu inceleyin.
                </p>
            </div>

            {/* AI Executive Summary */}
            <AIExecutiveSummary />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Toplam Personel"
                    value={data.stats.totalStaff}
                    icon={Users}
                    trend="+2 bu ay"
                    color="text-blue-600"
                    bg="bg-blue-50"
                    borderColor="border-blue-100"
                />
                <StatCard
                    title="Şu An Ofiste"
                    value={data.stats.activeStaffCount}
                    icon={UserCheck}
                    trend={`${Math.round((data.stats.activeStaffCount / (data.stats.totalStaff || 1)) * 100)}% katılım`}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    borderColor="border-emerald-100"
                />
                <StatCard
                    title="Geç Kalanlar"
                    value={data.stats.lateCount}
                    icon={Clock}
                    trend="Bugün"
                    color="text-amber-600"
                    bg="bg-amber-50"
                    borderColor="border-amber-100"
                />
                <StatCard
                    title="Bekleyen İşlemler"
                    value={data.stats.pendingLeaves + data.stats.pendingExpenses}
                    icon={AlertCircle}
                    trend="İzin & Harcama"
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    borderColor="border-indigo-100"
                />
                <StatCard
                    title="Anlık Ziyaretçi"
                    value={data.stats.activeVisitors}
                    icon={Users}
                    trend="Şu an ofiste"
                    color="text-pink-600"
                    bg="bg-pink-50"
                    borderColor="border-pink-100"
                />
                <StatCard
                    title="İş Başvurusu"
                    value={data.stats.newCandidates}
                    icon={Briefcase}
                    trend="Değerlendirilecek"
                    color="text-cyan-600"
                    bg="bg-cyan-50"
                    borderColor="border-cyan-100"
                />
                <StatCard
                    title="Bugünkü Rezervasyon"
                    value={data.stats.todayBookings}
                    icon={CalendarClock}
                    trend="Toplantı & Araç"
                    color="text-violet-600"
                    bg="bg-violet-50"
                    borderColor="border-violet-100"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Charts (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Attendance Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Haftalık Katılım Analizi</h3>
                                <p className="text-slate-400 text-xs">Son 7 günlük personel giriş verileri</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                <AreaChart data={data.chartData}>
                                    <defs>
                                        <linearGradient id="colorKatilim" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="katilim"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorKatilim)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-3xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <Wallet className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-purple-100">Bekleyen Harcamalar</span>
                                </div>
                                <div className="text-3xl font-bold">{data.stats.pendingExpenses} <span className="text-base font-normal text-purple-200">Adet</span></div>
                                <button className="mt-4 text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                                    İncele &rarr;
                                </button>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-6 rounded-3xl text-white relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 p-8 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-2 rounded-xl">
                                        <CalendarClock className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="font-medium text-orange-100">İzin Talepleri</span>
                                </div>
                                <div className="text-3xl font-bold">{data.stats.pendingLeaves} <span className="text-base font-normal text-orange-200">Bekleyen</span></div>
                                <button className="mt-4 text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                                    Onayla/Reddet &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Recent Activity (1/3 width) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Son Hareketler</h3>
                        <button className="text-slate-400 hover:text-slate-600">
                            <MoreHorizontal className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100"></div>

                        {data.recentActivities.length === 0 ? (
                            <p className="text-center text-slate-400 text-sm py-4">Henüz hareket yok.</p>
                        ) : data.recentActivities.map((activity, i) => (
                            <div key={i} className="flex gap-4 relative">
                                <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm z-10 flex items-center justify-center shrink-0
                                    ${activity.type === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
                                `}>
                                    {activity.type === 'CHECK_IN' ? (
                                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                                    ) : (
                                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{activity.user}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {activity.type === 'CHECK_IN' ? 'Giriş yaptı' : 'Çıkış yaptı'} • {activity.time}
                                        {activity.isLate && <span className="text-amber-500 ml-1 font-bold">(Geç)</span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: string;
    color: string;
    bg: string;
    borderColor: string;
}

function StatCard({ title, value, icon: Icon, trend, color, bg, borderColor }: StatCardProps) {
    return (
        <div className={`p-6 rounded-2xl border ${borderColor} ${bg} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl bg-white/60 backdrop-blur-sm ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {trend && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/50 ${color}`}>
                            {trend}
                        </span>
                    )}
                </div>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
                <p className={`text-sm font-medium mt-1 opacity-80 ${color.replace('text-', 'text-slate-')}`}>{title}</p>
            </div>
            {/* Decorative Background Icon */}
            <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Icon className={`h-24 w-24 ${color}`} />
            </div>
        </div>
    );
}
