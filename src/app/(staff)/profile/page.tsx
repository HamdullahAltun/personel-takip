import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LogOut, User, Phone, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import AttendanceCalendar from "@/components/AttendanceCalendar";
async function getUser() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        include: { attendance: { orderBy: { timestamp: 'desc' } } }
    });
    return user;
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
                    <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-600">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                        <p className="text-slate-500">{user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}</p>
                    </div>

                    <div className="mt-8 space-y-4">
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
                                <p className="text-sm font-semibold text-slate-900">{user.role}</p>
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
