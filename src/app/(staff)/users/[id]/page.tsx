"use client";

import { useEffect, useState } from "react";
import { User, Trophy, Star, MessageSquareText, Briefcase, Phone, Calendar, Clock, MapPin, Award, ClipboardList, Receipt, CalendarCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function UserProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        if (id) {
            fetch(`/api/users/${id}/profile`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setUser(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Yükleniyor...</div>;
    if (!user) return <div className="min-h-screen flex items-center justify-center text-red-500">Kullanıcı bulunamadı.</div>;

    const hasPrivilegedAccess = !!user.tasksReceived; // Check if we received detailed data

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-24 px-4 sm:px-0">
            {/* Header Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600"></div>
                <div className="px-6 pb-6">
                    <div className="relative -mt-16 mb-4 flex justify-between items-end">
                        <div className="bg-white p-2 rounded-full shadow-xl">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-400" />
                                )}
                            </div>
                        </div>
                        {user.isWorking ? (
                            <span className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-sm animate-in fade-in zoom-in duration-300">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                OFİSTE
                            </span>
                        ) : (
                            <span className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-xs font-bold border border-slate-200">
                                <Clock className="h-3.5 w-3.5" />
                                MESAİ DIŞI
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-500 flex items-center gap-2 text-sm mt-1 font-medium">
                            <Briefcase className="h-4 w-4 text-blue-500" />
                            {user.role === 'ADMIN' ? 'Yönetici' : user.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                        </p>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Link
                            href={`/messages/${user.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition shadow-lg shadow-slate-200"
                        >
                            <MessageSquareText className="h-4 w-4" />
                            Mesaj
                        </Link>
                        <a
                            href={`tel:${user.phone}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition"
                        >
                            <Phone className="h-4 w-4" />
                            Ara
                        </a>
                    </div>
                </div>
            </div>

            {/* Custom Tabs */}
            {hasPrivilegedAccess && (
                <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'general', label: 'Genel', icon: User },
                        { id: 'tasks', label: 'Görevler', icon: ClipboardList },
                        { id: 'expenses', label: 'Harcamalar', icon: Receipt },
                        { id: 'calendar', label: 'Takvim', icon: CalendarCheck },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        {/* Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                                    <Calendar className="h-4 w-4" />
                                    Katılım
                                </div>
                                <p className="font-bold text-slate-900 text-lg">
                                    {new Date(user.createdAt).getFullYear()}
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs font-bold uppercase tracking-wider">
                                    <MapPin className="h-4 w-4" />
                                    Ofis
                                </div>
                                <p className="font-bold text-slate-900 text-lg">İstanbul</p>
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    Başarımlar
                                </h3>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{user.achievements?.length || 0}</span>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {user.achievements?.length > 0 ? (
                                    user.achievements.map((ach: any) => (
                                        <div key={ach.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 border border-amber-100">
                                                <Star className="h-5 w-5 fill-current" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{ach.title}</h4>
                                                <p className="text-slate-500 text-xs mt-0.5">{ach.description}</p>
                                            </div>
                                            <div className="ml-auto text-[10px] text-slate-400 font-medium">
                                                {format(new Date(ach.date), "d MMM yyyy", { locale: tr })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        Henüz bir başarım kazanılmadı.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employee of the Month */}
                        {user.employeeOfTheMonths?.length > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-orange-100 shadow-sm p-4 flex items-center gap-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Award className="h-32 w-32 text-orange-600" />
                                </div>
                                <div className="bg-white p-3 rounded-2xl shadow-sm text-orange-500 border border-orange-100 relative z-10">
                                    <Award className="h-8 w-8" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-orange-900 text-lg">Ayın Personeli</h4>
                                    <p className="text-orange-700 text-sm">
                                        Bu gururu <span className="font-bold">{user.employeeOfTheMonths.length} kez</span> yaşadı.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tasks' && hasPrivilegedAccess && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {user.tasksReceived?.length > 0 ? (
                                    user.tasksReceived.map((task: any) => (
                                        <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-900 text-sm">{task.title}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                    ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'}`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-xs line-clamp-2">{task.description}</p>
                                            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(task.createdAt), "d MMMM yyyy", { locale: tr })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">Atanmış görev bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'expenses' && hasPrivilegedAccess && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {user.expenses?.length > 0 ? (
                                    user.expenses.map((exp: any) => (
                                        <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl ${exp.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                    exp.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                        'bg-amber-100 text-amber-600'}`}>
                                                    <Receipt className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm">{exp.description}</h4>
                                                    <p className="text-slate-500 text-xs">
                                                        {format(new Date(exp.date), "d MMM yyyy", { locale: tr })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">{exp.amount} ₺</p>
                                                <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide
                                                    ${exp.status === 'APPROVED' ? 'text-green-600' :
                                                        exp.status === 'REJECTED' ? 'text-red-600' :
                                                            'text-amber-600'}`}>
                                                    {exp.status === 'APPROVED' ? 'Onaylandı' : exp.status === 'REJECTED' ? 'Reddedildi' : 'Beklemede'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <Receipt className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-500 font-medium">Harcama kaydı bulunmuyor.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'calendar' && hasPrivilegedAccess && (
                    <div className="space-y-6">
                        {/* Work Schedule Summary */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Çalışma Programı
                            </h3>
                            <div className="space-y-2">
                                {user.workSchedules?.length > 0 ? (
                                    user.workSchedules.map((ws: any) => (
                                        <div key={ws.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50">
                                            <span className="font-medium text-slate-700">
                                                {["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][ws.dayOfWeek % 7]}
                                            </span>
                                            <span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                                                {ws.isOffDay ? 'İZİNLİ' : `${ws.startTime} - ${ws.endTime}`}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic">Program atanmamış.</p>
                                )}
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-slate-900 text-sm">Son Hareketler</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {user.attendance?.length > 0 ? (
                                    user.attendance.map((att: any) => (
                                        <div key={att.id} className="p-3 flex items-center justify-between text-sm hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${att.type === 'CHECK_IN' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="font-medium text-slate-700">
                                                    {att.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'}
                                                </span>
                                            </div>
                                            <span className="text-slate-500 text-xs">
                                                {format(new Date(att.timestamp), "d MMM HH:mm", { locale: tr })}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-slate-400 text-sm">Kayıt yok.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
