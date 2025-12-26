"use client";

import { useState } from "react";
import { User, AttendanceRecord, LeaveRequest, Achievement, WorkSchedule } from "@prisma/client";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2, ArrowLeft, Save, Clock, CalendarDays, Coins, User as UserIcon, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateEmployee, deleteEmployee } from "@/app/actions/employee";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import AchievementsList from "@/components/admin/AchievementsList";

type UserWithRelations = User & {
    attendance: AttendanceRecord[];
    leaves: LeaveRequest[];
    achievements: Achievement[];
    workSchedules: WorkSchedule[];
};

export default function EmployeeDetailClient({ user }: { user: UserWithRelations }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Initialize schedules state with default if empty
    const defaultSchedules = Array.from({ length: 7 }, (_, i) => {
        const existing = user.workSchedules.find(s => s.dayOfWeek === i + 1);
        return existing || {
            dayOfWeek: i + 1,
            startTime: "09:00",
            endTime: "18:00",
            isOffDay: i + 1 === 6 || i + 1 === 7 // Sat/Sun off by default
        };
    });

    const [schedules, setSchedules] = useState<any[]>(defaultSchedules);

    const handleScheduleChange = (index: number, field: string, value: any) => {
        const newSchedules = [...schedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setSchedules(newSchedules);
    };

    const saveSchedule = async () => {
        setLoading(true);
        try {
            await fetch(`/api/users/${user.id}/schedule`, {
                method: 'POST',
                body: JSON.stringify(schedules),
                headers: { 'Content-Type': 'application/json' }
            });
            alert("Çalışma saatleri güncellendi.");
            router.refresh();
        } catch (error) {
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Stats
    const sortedRecords = [...user.attendance].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let calculatedHours = 0;
    for (let i = 0; i < sortedRecords.length; i++) {
        if (sortedRecords[i].type === 'CHECK_IN' && sortedRecords[i + 1]?.type === 'CHECK_OUT') {
            const diff = new Date(sortedRecords[i + 1].timestamp).getTime() - new Date(sortedRecords[i].timestamp).getTime();
            calculatedHours += diff / (1000 * 60 * 60);
            i++;
        }
    }

    const calculatedPay = calculatedHours * (user.hourlyRate || 0);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        await updateEmployee(user.id, null, formData);
        setLoading(false);
        router.refresh();
        alert("Bilgiler güncellendi!");
    };

    const handleDelete = async () => {
        if (!confirm("Bu personeli ve tüm verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        setLoading(true);
        await deleteEmployee(user.id);
        router.push("/admin/employees");
        router.refresh();
    };

    const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Listeye Dön
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Edit Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative group cursor-pointer">
                                <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                                    {user.profilePicture ? (
                                        <img src={user.profilePicture} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="h-8 w-8 text-slate-400" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <span className="text-white text-xs font-bold">Değiştir</span>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                // Create a hidden input to submit with the form, or update state
                                                const base64 = reader.result as string;
                                                const form = e.target.closest('form');
                                                // Manually update the DOM for preview or force restart
                                                // Ideally we use state, but this component is complex.
                                                // Let's use simple state for preview.
                                                const img = e.target.parentElement?.querySelector('img');
                                                if (img) img.src = base64;

                                                // Add hidden input dynamically if not exists
                                                let hidden = form?.querySelector('input[name="profilePicture"]') as HTMLInputElement;
                                                if (!hidden) {
                                                    hidden = document.createElement('input');
                                                    hidden.type = 'hidden';
                                                    hidden.name = 'profilePicture';
                                                    form?.appendChild(hidden);
                                                }
                                                hidden.value = base64;
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-900">Profil Bilgileri</h2>
                                <p className="text-sm text-slate-500">Kişisel detayları düzenle</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Hidden input placeholder if needed, though dynamic addition works above */}
                            <input type="hidden" name="profilePicture" defaultValue={user.profilePicture || ''} />
                            <div>
                                <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
                                <input name="name" defaultValue={user.name} className="w-full mt-1 border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Telefon</label>
                                <input name="phone" defaultValue={user.phone} className="w-full mt-1 border rounded-lg p-2" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">E-Posta</label>
                                <input name="email" type="email" defaultValue={user.email || ''} className="w-full mt-1 border rounded-lg p-2" placeholder="opsiyonel@ornek.com" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Saatlik Ücret (₺)</label>
                                <input name="hourlyRate" type="number" step="0.5" defaultValue={user.hourlyRate} className="w-full mt-1 border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Haftalık Hedef (Saat)</label>
                                <input name="weeklyGoal" type="number" defaultValue={user.weeklyGoal} className="w-full mt-1 border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Yıllık İzin Hakkı (Gün)</label>
                                <input name="annualLeaveDays" type="number" defaultValue={user.annualLeaveDays} className="w-full mt-1 border rounded-lg p-2" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Rol</label>
                                <select name="role" defaultValue={user.role} className="w-full mt-1 border rounded-lg p-2 bg-white">
                                    <option value="STAFF">Personel</option>
                                    <option value="ADMIN">Yönetici</option>
                                </select>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                <Save className="h-4 w-4" />
                                {loading ? "Kaydediliyor..." : "Kaydet"}
                            </button>

                            <hr className="my-4 border-slate-100" />

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Trash2 className="h-4 w-4" />
                                Personeli Sil
                            </button>
                        </form>
                    </div>

                    <div className="">
                        <AchievementsList achievements={user.achievements} userId={user.id} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="md:col-span-2 space-y-6">

                    {/* Work Schedule Editor */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-slate-500" />
                                <h3 className="font-semibold text-slate-900">Çalışma Saatleri</h3>
                            </div>
                            <button onClick={saveSchedule} disabled={loading} className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">
                                {loading ? "..." : "Güncelle"}
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {schedules.map((s, i) => (
                                <div key={i} className="flex items-center gap-4 text-sm">
                                    <div className="w-24 font-medium text-slate-700">{DAYS[i]}</div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input
                                            type="time"
                                            value={s.startTime}
                                            disabled={s.isOffDay}
                                            onChange={e => handleScheduleChange(i, 'startTime', e.target.value)}
                                            className="border rounded px-2 py-1 disabled:opacity-50"
                                        />
                                        <input
                                            type="time"
                                            value={s.endTime}
                                            disabled={s.isOffDay}
                                            onChange={e => handleScheduleChange(i, 'endTime', e.target.value)}
                                            className="border rounded px-2 py-1 disabled:opacity-50"
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer w-24 justify-end">
                                        <input
                                            type="checkbox"
                                            checked={s.isOffDay}
                                            onChange={e => handleScheduleChange(i, 'isOffDay', e.target.checked)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-500 text-xs">Tatil</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">Toplam Çalışma</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{calculatedHours.toFixed(1)} Saat</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                                <Coins className="h-4 w-4" />
                                <span className="text-sm font-medium">Tahmini Hakediş</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900">₺{calculatedPay.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Calendar View */}
                    <div className="space-y-2">
                        <h3 className="font-semibold text-slate-900">Çalışma Takvimi</h3>
                        <AttendanceCalendar records={user.attendance} />
                    </div>

                    {/* Attendance Logs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <CalendarDays className="h-5 w-5 text-slate-500" />
                            <h3 className="font-semibold text-slate-900">Son Hareketler</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Tarih</th>
                                        <th className="px-4 py-2">İşlem</th>
                                        <th className="px-4 py-2">Yöntem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {user.attendance.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 text-slate-900">
                                                {format(new Date(record.timestamp), "d MMMM yyyy HH:mm", { locale: tr })}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${record.type === 'CHECK_IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {record.type === 'CHECK_IN' ? 'GİRİŞ' : 'ÇIKIŞ'}
                                                </span>
                                                {record.isLate && (
                                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold border border-red-200">
                                                        GEÇ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-slate-500 text-xs">
                                                {record.method}
                                            </td>
                                        </tr>
                                    ))}
                                    {user.attendance.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Kayıt bulunamadı.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Leave History */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-semibold text-slate-900">İzin Geçmişi</h3>
                        </div>
                        <div className="p-4">
                            {user.leaves.length > 0 ? (
                                <ul className="space-y-3">
                                    {user.leaves.map(leave => (
                                        <li key={leave.id} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                            <div>
                                                <p className="font-medium">{leave.reason}</p>
                                                <p className="text-slate-500 text-xs">
                                                    {format(new Date(leave.startDate), "d MMM", { locale: tr })} - {format(new Date(leave.endDate), "d MMM yyyy", { locale: tr })}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {leave.status === 'APPROVED' ? 'ONAYLANDI' : leave.status === 'REJECTED' ? 'REDDEDİLDİ' : 'BEKLİYOR'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-4">İzin kaydı yok.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
