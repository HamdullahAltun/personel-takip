"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, Wallet, Search } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdvanceRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING'); // PENDING, ALL

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/finance/advance'); // Admin gets all
            const data = await res.json();
            if (Array.isArray(data)) setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(status === 'APPROVED' ? "Bu avans talebini onaylıyor musunuz?" : "Bu talebi reddetmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch('/api/finance/advance', {
                method: 'PATCH',
                body: JSON.stringify({ id, status }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success(status === 'APPROVED' ? "Talep onaylandı" : "Talep reddedildi");
                fetchRequests();
            } else {
                toast.error("İşlem başarısız");
            }
        } catch (e) {
            toast.error("Hata oluştu");
        }
    };

    const filteredRequests = requests.filter(r => filter === 'ALL' || r.status === filter);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Avans Talepleri</h1>
                    <p className="text-slate-500">Personel avans taleplerini yönetin</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'PENDING' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Bekleyenler
                    </button>
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tümü
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="p-4 font-medium">Personel</th>
                            <th className="p-4 font-medium">Tutar</th>
                            <th className="p-4 font-medium">Talep Tarihi</th>
                            <th className="p-4 font-medium">Sebep</th>
                            <th className="p-4 font-medium">Durum</th>
                            <th className="p-4 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : filteredRequests.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                        ) : (
                            filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{req.user.name}</div>
                                        <div className="text-xs text-slate-500">{req.user.role}</div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-900">₺{req.amount.toLocaleString('tr-TR')}</td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">
                                        {format(new Date(req.requestedAt), 'd MMM HH:mm', { locale: tr })}
                                    </td>
                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                                        {req.reason}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                            }`}>
                                            {req.status === 'APPROVED' ? <CheckCircle className="h-3 w-3" /> :
                                                req.status === 'REJECTED' ? <XCircle className="h-3 w-3" /> :
                                                    <Clock className="h-3 w-3" />}
                                            {req.status === 'APPROVED' ? 'Onaylandı' : req.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction(req.id, 'APPROVED')}
                                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                                                    title="Onayla"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req.id, 'REJECTED')}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                                                    title="Reddet"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </button>
                                            </div>
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
