import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogOut, User, Phone, Shield, Calendar, Trophy, Star, FileClock, Laptop } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import ScheduleWidget from "@/components/staff/ScheduleWidget";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemeEditor from "@/components/ThemeEditor";

async function getUser() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        include: {
            attendance: { orderBy: { timestamp: 'desc' } },
            achievements: { orderBy: { date: 'desc' } },
            workSchedules: true,
            assets: true,
            documents: { orderBy: { uploadedAt: 'desc' } }
        }
    });
    return user as any;
}

export default async function ProfilePage() {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6 max-w-md mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Profilim</h1>
                <p className="text-slate-500">Kişisel bilgileriniz</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <div className="px-6 pb-6 mt-[-40px]">
                    <ProfileAvatar currentImage={user.profilePicture} userName={user.name} />

                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                        <p className="text-slate-500">{user.role === 'ADMIN' ? 'Yönetici' : user.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}</p>

                        <a href={`/card/${user.id}`} target="_blank" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Dijital Kartvizitimi Paylaş
                        </a>
                    </div>

                    <div className="mt-8 space-y-4">
                        {/* Achievements Replacement */}
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 space-y-3">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                Başarımlarım
                            </h3>
                            {user.achievements.length > 0 ? (
                                <div className="space-y-2">
                                    {user.achievements.map((ach: any) => (
                                        <div key={ach.id} className="bg-white p-2.5 rounded-lg flex items-center gap-3 shadow-sm border border-yellow-100/50">
                                            <div className="bg-yellow-100 p-1.5 rounded-full text-yellow-600">
                                                <Star className="h-3 w-3 fill-current" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-xs">{ach.title}</h4>
                                                {ach.description && <p className="text-slate-500 text-[10px]">{ach.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">Henüz bir başarım kazanılmadı.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                            <Phone className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Telefon Numarası</p>
                                <p className="text-sm font-semibold text-slate-900">{user.phone}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                            <Shield className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Rol</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {user.role === 'ADMIN' ? 'Yönetici' : user.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Kayıt Tarihi</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {format(user.createdAt, "d MMMM yyyy", { locale: tr })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assets Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-indigo-600" />
                    Zimmetlerim
                </h3>
                {user.assets && user.assets.length > 0 ? (
                    <div className="space-y-3">
                        {user.assets.map((asset: any) => (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">{asset.name}</p>
                                    <p className="text-xs text-slate-500">{asset.type} • {asset.serialNumber || 'S/N Yok'}</p>
                                </div>
                                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Aktif
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">Üzerinize zimmetli demirbaş bulunmuyor.</p>
                )}
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileClock className="h-5 w-5 text-orange-600" />
                    Belgelerim
                </h3>
                {user.documents && user.documents.length > 0 ? (
                    <div className="space-y-3">
                        {user.documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-500">
                                        <FileClock className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900">{doc.title}</p>
                                        <p className="text-xs text-slate-500">{format(doc.uploadedAt, 'd MMM yyyy')}</p>
                                    </div>
                                </div>
                                <Link href={doc.fileUrl} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">
                                    Görüntüle
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-sm text-slate-500">Henüz belge yüklenmemiş.</p>
                        <button className="mt-2 text-xs font-bold text-blue-600 hover:underline">
                            + Belge Yükle (Admin ile görüşün)
                        </button>
                    </div>
                )}
            </div>



            {/* Schedule Widget */}
            <ScheduleWidget schedules={user.workSchedules} />

            {/* Theme & Appearance */}
            <ThemeEditor />

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
                <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Çalışma Takvimim</h3>
                <AttendanceCalendar records={user.attendance} />
            </div>

            <form
                action={async () => {
                    "use server";
                    const cookieStore = await cookies();
                    cookieStore.delete("personel_token");
                    redirect("/login");
                }}
            >
                <button
                    type="submit"
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="h-5 w-5" />
                    Çıkış Yap
                </button>
            </form>
        </div>
    );
}
