"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Search, Calendar, UserCheck, Clock, MapPin, Loader2 } from "lucide-react";

type AttendanceRecord = {
    id: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    timestamp: string;
    method: string;
    isLate: boolean;
    user: {
        name: string;
        role: string;
    };
};

export default function AdminAttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [filterUser, setFilterUser] = useState("");

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    };

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterDate) params.append('date', filterDate);
            if (filterUser) params.append('userId', filterUser);

            const res = await fetch(`/api/attendance?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = "/api/auth/logout";
                return;
            }
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setRecords(data);
                } else {
                    setRecords([]);
                }
            }
        } catch (e) {
            console.error(e);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchRecords();
        const interval = setInterval(fetchRecords, 5000);
        return () => clearInterval(interval);
    }, [filterDate, filterUser]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Katılım ve Yoklama</h1>
                    <p className="text-slate-500">Personel giriş-çıkış hareketleri</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* User Filter */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <UserCheck className="h-4 w-4 text-slate-400" />
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="outline-none text-sm text-slate-700 bg-transparent min-w-[150px]"
                        >
                            <option value="">Tüm Personeller</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="outline-none text-sm text-slate-700 bg-transparent"
                        />
                        {filterDate && (
                            <button
                                onClick={() => setFilterDate("")}
                                className="text-xs text-slate-400 hover:text-slate-600 ml-2"
                            >
                                Temizle
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                            <th className="p-4">Personel</th>
                            <th className="p-4">İşlem</th>
                            <th className="p-4">Zaman</th>
                            <th className="p-4">Yöntem</th>
                            <th className="p-4">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Yükleniyor...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                        ) : (
                            records.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 font-medium text-slate-900">{rec.user.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1
                                            ${rec.type === 'CHECK_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {rec.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 tabular-nums">
                                        {format(new Date(rec.timestamp), "d MMM HH:mm", { locale: tr })}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">
                                            {rec.method}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {rec.isLate ? (
                                            <span className="text-red-500 text-xs font-bold animate-pulse">GEÇ KALDI</span>
                                        ) : (
                                            <span className="text-green-500 text-xs font-bold">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
