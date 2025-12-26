import WelcomeHeader from "@/components/WelcomeHeader";

// ... existing imports

export default async function StaffDashboard() {
    // ... existing logic

    return (
        <div className="space-y-6">
            <WelcomeHeader userName={user.name} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Card */}
                {/* ... (This part was handled in previous replace_file_content logic but let's assume the previous call succeeded on the content. I need to handle imports here) */}
                {/* Wait, I need to be careful not to overwrite the content I just wrote in Step 3. 
                   The previous replace_file_content replaced lines 46-71. 
                   This replace_file_content should target lines 76-87 which is the OLD simple stats card and REMOVE it. 
                   AND add the import at the top. 
                   Since I can't do two disparate blocks easily without multi_replace, I'll do multi_replace.
                */}
                import {verifyJWT} from "@/lib/auth";
                import {cookies} from "next/headers";
                import {redirect} from "next/navigation";
                import Link from "next/link";
                import {format, differenceInMinutes} from "date-fns";
                import {tr} from "date-fns/locale";
                import {ScanLine, LogOut, Clock, Calendar} from "lucide-react";
                import DashboardWidgetsClient from "@/components/staff/DashboardWidgetsClient";

                async function getUser() {
    const token = (await cookies()).get("personel_token")?.value;
                if (!token) return null;
                const payload = await verifyJWT(token);
                if (!payload) return null;

                return await prisma.user.findUnique({
                    where: {id: payload.id as string },
                include: {
                    attendance: {
                    orderBy: {timestamp: 'desc' },
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

                return (
                <div className="space-y-6">
                    <WelcomeHeader userName={user.name} />

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

                        {/* Weekly Goal Card - Moved here from below */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock className="h-32 w-32 text-green-600" />
                            </div>
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Bu Haftaki Performans</p>
                                <div className="mt-2">
                                    <p className="text-3xl font-bold text-slate-900">32.5 <span className="text-lg text-slate-400 font-normal">Saat</span></p>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                                <p className="text-slate-400 text-xs mt-2">Hedef: {user.weeklyGoal} Saat (%75 Tamamlandı)</p>
                            </div>
                        </div>
                    </div>

                    {/* Widgets (Real-time) */}
                    <DashboardWidgetsClient />

                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-medium">Bu Haftaki Çalışma</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">32.5 Saat</p>
                                <p className="text-green-600 text-[10px] font-bold mt-1">Hedef: {user.weeklyGoal} Saat</p>
                            </div>
                            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600">
                                <Clock className="h-6 w-6" />
                            </div>
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
                </div >
                );
}
