"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Laptop, Calendar, User, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export default function AssetDetailPage() {
    const params = useParams();
    const [asset, setAsset] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [assignUser, setAssignUser] = useState("");

    useEffect(() => {
        fetchAsset();
        fetchUsers();
    }, []);

    const fetchAsset = async () => {
        const res = await fetch(`/api/assets/${params.id}`);
        if (res.ok) setAsset(await res.json());
        setLoading(false);
    }

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    }

    const handleAssign = async () => {
        if (!assignUser) return;
        await fetch(`/api/assets/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify({ userId: assignUser, action: 'ASSIGN' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchAsset();
    };

    const handleReturn = async () => {
        if (!confirm('Zimmeti düşürmek istiyor musunuz?')) return;
        await fetch(`/api/assets/${params.id}`, {
            method: 'PUT',
            body: JSON.stringify({ action: 'RETURN' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchAsset();
    };

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
    if (!asset) return <div className="p-10 text-center">Demirbaş bulunamadı.</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Link href="/admin/assets" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition mb-6">
                <ArrowLeft className="h-4 w-4" /> Geri Dön
            </Link>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-md border border-white/20">
                            {asset.type}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{asset.name}</h1>
                        <p className="opacity-80 font-mono tracking-wider">{asset.serialNumber || 'SN: -'}</p>
                    </div>
                    <Laptop className="absolute -right-6 -bottom-6 h-48 w-48 text-white/5 rotate-12" />
                </div>

                <div className="p-8">
                    {asset.status === 'ASSIGNED' ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="h-24 w-24 text-green-600" /></div>
                            <p className="text-green-800 font-bold mb-4">Şu an zimmetli:</p>
                            <div className="flex flex-col items-center gap-3 relative z-10">
                                <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden">
                                    {asset.assignedTo?.profilePicture ?
                                        <img src={asset.assignedTo.profilePicture} className="w-full h-full object-cover" /> :
                                        <User className="h-8 w-8 text-slate-400" />
                                    }
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{asset.assignedTo?.name}</h3>
                                    <p className="text-slate-500 text-sm">{format(new Date(asset.assignedDate), 'd MMMM yyyy HH:mm', { locale: tr })}</p>
                                </div>
                                <button onClick={handleReturn} className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg shadow-sm hover:bg-red-50 transition">
                                    Zimmeti Düşür
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
                            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Bu demirbaş şu an boşta.
                            </div>
                            <div className="flex gap-2">
                                <select value={assignUser} onChange={e => setAssignUser(e.target.value)} className="flex-1 border p-2 rounded-lg">
                                    <option value="">Personel Seçin...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <button onClick={handleAssign} disabled={!assignUser} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50">Zimmetle</button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-bold border-b pb-2">Notlar</h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            {asset.notes || 'Not girilmemiş.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
