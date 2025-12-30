import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInMinutes, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { ScanLine, Clock, Trophy, Crown, Star } from "lucide-react";
import DashboardWidgetsClient from "@/components/staff/DashboardWidgetsClient";
import WelcomeHeader from "@/components/WelcomeHeader";

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
        <div className="space-y-6">
            <WelcomeHeader userName={user.name} />

            <DashboardWidgetsClient />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ScanLine className="h-32 w-32 text-blue-600" />
                    </div>

                    <div>
                        <p className="text-slate-500 text-sm font-medium">Şu Anki Durum</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`relative flex h-4 w-4`}>
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCheckedIn ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-4 w-4 ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <p className="text-2xl font-bold text-slate-900">
                                {isCheckedIn ? "Çalışıyorsunuz" : "Ofis Dışında"}
                            </p>
                        </div>
                        {isCheckedIn && (
                            <p className="text-slate-400 text-xs mt-2 font-medium bg-slate-50 inline-block px-2 py-1 rounded-lg">
                                Giriş: {format(lastRecord.timestamp, 'HH:mm')} • Süre: {durationText}
                            </p>
                        )}
                    </div>

                    <div className="mt-6">
                        <Link href="/scan" className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all
                            ${isCheckedIn ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
                            <ScanLine className="h-5 w-5" />
                            {isCheckedIn ? "Çıkış Yap" : "Giriş Yap"}
                        </Link>
                    </div>
                </div>

                {/* Weekly Goal Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="h-32 w-32 text-green-600" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Bu Haftaki Performans</p>
                        <div className="mt-2">
                            <p className="text-3xl font-bold text-slate-900">{workedHours} <span className="text-lg text-slate-400 font-normal">Saat</span></p>
                        </div>
                        <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className={cn("h-2.5 rounded-full transition-all duration-1000", progressPercent >= 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <p className="text-slate-400 text-xs mt-2">Hedef: {weeklyGoal} Saat (%{progressPercent} Tamamlandı)</p>
                    </div>
                </div>
            </div>

            {/* Achievements Section */}
            {(user.achievements.length > 0 || user.employeeOfTheMonths.length > 0) && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                    <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Başarımlarım
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {user.employeeOfTheMonths.map(e => (
                            <div key={e.id} className="min-w-[140px] bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 text-center flex-shrink-0">
                                <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2 shadow-sm">
                                    <Crown className="h-6 w-6 text-yellow-500" />
                                </div>
                                <p className="font-bold text-slate-800 text-sm whitespace-nowrap">{e.month}. Ayın Personeli</p>
                                <p className="text-xs text-slate-500">{e.year}</p>
                            </div>
                        ))}
                        {user.achievements.map(a => (
                            <div key={a.id} className="min-w-[140px] bg-slate-50 p-4 rounded-xl border border-slate-200 text-center flex-shrink-0">
                                <div className="bg-white rounded-full h-10 w-10 flex items-center justify-center mx-auto mb-2 shadow-sm">
                                    <Star className="h-6 w-6 text-indigo-500" />
                                </div>
                                <p className="font-bold text-slate-800 text-sm">{a.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Son İşlemler</h2>
                <div className="space-y-4">
                    <div className="text-center text-slate-400 py-4 text-sm">
                        Henüz geçmiş görüntülenemiyor.
                    </div>
                </div>
            </div>
        </div >
    );
}
