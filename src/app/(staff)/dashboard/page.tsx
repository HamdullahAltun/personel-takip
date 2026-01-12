import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInMinutes, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { ScanLine, Clock, Trophy, Crown, Star, Calendar } from "lucide-react";
import DashboardWidgetsClient from "@/components/staff/DashboardWidgetsClient";
import WelcomeHeader from "@/components/WelcomeHeader";
import DailyMotivation from "@/components/staff/DailyMotivation";
import DashboardQuickActions from "@/components/staff/DashboardQuickActions";
import TopPerformers from "@/components/staff/TopPerformers";
import TeamMood from "@/components/staff/TeamMood";
import PullToRefresh from "@/components/ui/PullToRefresh";
import EmergencyBanner from "@/components/EmergencyBanner";

import { cn } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ana Sayfa",
};


async function getUser() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload) return null;

    return await prisma.user.findUnique({
        where: { id: payload.id as string },
        include: {
            attendance: {
                orderBy: { timestamp: 'desc' },
                take: 1
            },
            achievements: {
                orderBy: { date: 'desc' }
            },
            employeeOfTheMonths: {
                orderBy: { createdAt: 'desc' }
            },
            shifts: {
                where: { startTime: { gte: new Date() } },
                orderBy: { startTime: 'asc' },
                take: 1
            }
        }
    });
}

export default async function StaffDashboard() {
    const user = await getUser();
    if (!user) redirect("/login");

    const lastRecord = user.attendance[0];
    const isCheckedIn = lastRecord?.type === 'CHECK_IN';

    // Calculate duration if checked in
    let durationText = "";
    if (isCheckedIn) {
        const minutes = differenceInMinutes(new Date(), lastRecord.timestamp);
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        durationText = `${h}s ${m}d`;
    }

    // Weekly Performance Calculation
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weeklyRecords = await prisma.attendanceRecord.findMany({
        where: {
            userId: user.id,
            timestamp: {
                gte: weekStart,
                lte: weekEnd
            }
        },
        orderBy: { timestamp: 'asc' }
    });

    let totalMinutes = 0;
    let lastCheckInTime: Date | null = null;

    weeklyRecords.forEach(record => {
        if (record.type === 'CHECK_IN') {
            if (!lastCheckInTime) lastCheckInTime = record.timestamp;
        } else if (record.type === 'CHECK_OUT') {
            if (lastCheckInTime) {
                totalMinutes += differenceInMinutes(record.timestamp, lastCheckInTime);
                lastCheckInTime = null;
            }
        }
    });

    if (lastCheckInTime) {
        totalMinutes += differenceInMinutes(new Date(), lastCheckInTime);
    }

    const workedHours = (totalMinutes / 60).toFixed(1);
    const weeklyGoal = user.weeklyGoal || 45;
    const progressPercent = Math.min(100, Math.round((totalMinutes / (weeklyGoal * 60)) * 100));

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <EmergencyBanner />
            <PullToRefresh>
                <div className="space-y-6">
                    <WelcomeHeader userName={user.name} />

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Status Card - Compact */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Durum</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`relative flex h-3 w-3`}>
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCheckedIn ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isCheckedIn ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        </span>
                                        <p className="text-xl font-black text-slate-900">
                                            {isCheckedIn ? "Çalışıyor" : "Ofis Dışında"}
                                        </p>
                                    </div>
                                    {isCheckedIn && (
                                        <p className="text-emerald-600 text-xs mt-1 font-bold">
                                            {durationText} süredir aktif
                                        </p>
                                    )}
                                </div>
                                <div className={`p-3 rounded-2xl ${isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    <ScanLine className="h-6 w-6" />
                                </div>
                            </div>
                            <Link
                                href="/scan"
                                className="mt-6 flex items-center justify-center w-full py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                                {isCheckedIn ? "Çıkış Yap" : "Mesai Başlat"}
                            </Link>
                        </div>

                        {/* Weekly Goal - Compact */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Haftalık Hedef</p>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-slate-900">{workedHours}</span>
                                        <span className="text-sm font-bold text-slate-400">/ {weeklyGoal} Saat</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all duration-1000", progressPercent >= 100 ? "bg-emerald-500" : "bg-blue-600")}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-right text-xs font-bold text-slate-400 mt-2">%{progressPercent} Tamamlandı</p>
                            </div>
                        </div>

                        {/* Motivation Card */}
                        <DailyMotivation />
                    </div>

                    <DashboardQuickActions />

                    {/* Main Content Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column: Upcoming & Tasks */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shift Banner */}
                            {user.shifts[0] ? (
                                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

                                    <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">Sıradaki Vardiya</span>
                                            </div>
                                            <h3 className="text-3xl font-black mb-1">{format(new Date(user.shifts[0].startTime), 'EEEE', { locale: tr })}</h3>
                                            <p className="text-indigo-100 font-medium">{format(new Date(user.shifts[0].startTime), 'd MMMM yyyy', { locale: tr })}</p>

                                            <div className="flex items-center gap-4 mt-6">
                                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                                    <p className="text-xs text-indigo-200 uppercase font-bold">Başlangıç</p>
                                                    <p className="text-lg font-black">{format(new Date(user.shifts[0].startTime), 'HH:mm')}</p>
                                                </div>
                                                <div className="h-px w-8 bg-white/20"></div>
                                                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                                                    <p className="text-xs text-indigo-200 uppercase font-bold">Bitiş</p>
                                                    <p className="text-lg font-black">{format(new Date(user.shifts[0].endTime), 'HH:mm')}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10 hidden sm:block">
                                            <Calendar className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                                    <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <h3 className="text-slate-900 font-bold">Planlanmış Vardiya Yok</h3>
                                    <p className="text-slate-500 text-sm">Önümüzdeki günler için vardiya planınız bulunmuyor.</p>
                                </div>
                            )}

                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Panoyla Etkileşim
                                    </h2>
                                </div>
                                <DashboardWidgetsClient />
                            </div>
                        </div>

                        {/* Right Column: Achievements & Mini Details */}
                        <div className="space-y-6">
                            <TopPerformers />
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                                <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Crown className="h-5 w-5 text-yellow-500" />
                                    Son Başarımlar
                                </h2>

                                {(user.achievements.length > 0 || user.employeeOfTheMonths.length > 0) ? (
                                    <div className="space-y-4">
                                        {user.employeeOfTheMonths.slice(0, 1).map(e => (
                                            <div key={e.id} className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-2xl border border-amber-200 flex items-center gap-4">
                                                <div className="bg-white p-3 rounded-full shadow-sm">
                                                    <Crown className="h-6 w-6 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-amber-900 text-sm">Ayın Personeli</p>
                                                    <p className="text-xs text-amber-700 font-medium">{e.month} {e.year}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {user.achievements.slice(0, 3).map(a => (
                                            <div key={a.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    <Star className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 text-sm truncate">{a.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{format(new Date(a.date), 'd MMMM yyyy', { locale: tr })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-slate-400 text-sm">Henüz başarım kazanılmadı.</p>
                                    </div>
                                )}

                                <Link href="/profile" className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 mt-6 hover:underline">
                                    Tümünü Gör
                                </Link>
                            </div>

                            <TeamMood />
                        </div>
                    </div>
                </div>
            </PullToRefresh>
        </div>
    );
}

