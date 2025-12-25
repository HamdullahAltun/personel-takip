import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format, differenceInMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { ScanLine, LogOut, Clock, Calendar } from "lucide-react";
import AnnouncementWidget from "@/components/staff/AnnouncementWidget";
import EOMWidget from "@/components/staff/EOMWidget";

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
            }
        }
    });
}

export default async function StaffDashboard() {
    const user = await getUser();
    if (!user) redirect("/login");

    // Fetch EOM
    const today = new Date();
    const eom = await prisma.employeeOfTheMonth.findFirst({
        where: { month: today.getMonth() + 1, year: today.getFullYear() },
        include: { user: { select: { name: true } } }
    });

    // Fetch Latest Announcement
    const announcement = await prisma.announcement.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    });

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

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/30">
                <h1 className="text-xl font-medium opacity-90">Merhaba,</h1>
                <p className="text-3xl font-bold mt-1">{user.name}</p>

                <div className="mt-8 flex items-center justify-between">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">Şu Anki Durum</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`h-3 w-3 rounded-full animate-pulse ${isCheckedIn ? 'bg-green-400' : 'bg-red-400'}`} />
                            <p className="text-lg font-bold">
                                {isCheckedIn ? "Çalışıyorsunuz" : "Ofis Dışında"}
                            </p>
                        </div>
                        {isCheckedIn && (
                            <p className="text-blue-200 text-xs mt-1">
                                Giriş: {format(lastRecord.timestamp, 'HH:mm')} • Süre: {durationText}
                            </p>
                        )}
                    </div>

                    <Link href="/scan" className="bg-white text-blue-700 px-4 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 active:scale-95 transition-transform">
                        <ScanLine className="h-4 w-4" />
                        {isCheckedIn ? "Çıkış Yap" : "Giriş Yap"}
                    </Link>
                </div>
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-1 gap-4">
                <AnnouncementWidget announcement={announcement} />
                <EOMWidget data={eom} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-3">
                        <Clock className="h-5 w-5" />
                    </div>
                    <p className="text-slate-500 text-xs font-medium">Bu Hafta</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">32.5s</p>
                    <p className="text-green-600 text-[10px] font-bold mt-1">Hedef: {user.weeklyGoal}s</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 mb-3">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <p className="text-slate-500 text-xs font-medium">İzin Hakkı</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">14 Gün</p>
                    <p className="text-purple-600 text-[10px] font-bold mt-1">Kalan</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Son İşlemler</h2>
                <div className="space-y-4">
                    {/* Placeholder loop, normally map user.attendance but take more than 1 */}
                    {/* Fetch again or pass more data. For now, empty or mock. */}
                    <div className="text-center text-slate-400 py-4 text-sm">
                        Henüz geçmiş görüntülenemiyor.
                    </div>
                </div>
            </div>
        </div>
    );
}
