"use client";

import { useState, useEffect } from "react";
import { Laptop, Phone, Car, Key, Plus, Search, User, CheckCircle2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminAssetsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", serialNumber: "", type: "LAPTOP", status: "AVAILABLE", notes: "" });
    const [assignModal, setAssignModal] = useState<any>(null);

    useEffect(() => {
        fetchData();
        // Fetch users for dropdown safely
        fetch('/api/users')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
                else setUsers([]);
            })
            .catch(e => {
                console.error("Users fetch error:", e);
                setUsers([]);
            });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/assets');

            if (res.status === 401) {
                window.location.href = "/api/auth/logout";
                return;
            }

            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setAssets(data);
            } else {
                console.error("Assets fetch failed:", res.status, data);
                setAssets([]);
            }
        } catch (e) {
            console.error("Assets fetch error:", e);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/assets', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ name: "", serialNumber: "", type: "LAPTOP", status: "AVAILABLE", notes: "" });
        fetchData();
    };

    const handleAssign = async (assetId: string, userId: string) => {
        await fetch('/api/assets', {
            method: 'PATCH',
            body: JSON.stringify({ id: assetId, assignedToId: userId, action: 'ASSIGN' }),
            headers: { 'Content-Type': 'application/json' }
        });
        setAssignModal(null);
        fetchData();
    };

    const handleReturn = async (assetId: string) => {
        if (!confirm("Zimmeti geri almak istiyor musunuz?")) return;
        await fetch('/api/assets', {
            method: 'PATCH',
            body: JSON.stringify({ id: assetId, action: 'RETURN' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'LAPTOP': return <Laptop className="h-5 w-5" />;
            case 'PHONE': return <Phone className="h-5 w-5" />;
            case 'CAR': return <Car className="h-5 w-5" />;
            case 'KEY': return <Key className="h-5 w-5" />;
            default: return <Laptop className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Demirbaş & Zimmet Yönetimi</h1>
                    <p className="text-slate-500">Şirket varlıklarını takip edin ve personele atayın</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Demirbaş Ekle
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="p-4 font-medium">Demirbaş Adı</th>
                            <th className="p-4 font-medium">Seri No</th>
                            <th className="p-4 font-medium">Türü</th>
                            <th className="p-4 font-medium">Durum</th>
                            <th className="p-4 font-medium">Zimmetli Kişi</th>
                            <th className="p-4 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center" >Yükleniyor...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded text-slate-600">
                                            {getIcon(asset.type)}
                                        </div>
                                        {asset.name}
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono text-xs">{asset.serialNumber || '-'}</td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">{asset.type}</span>
                                    </td>
                                    <td className="p-4">
                                        {asset.status === 'ASSIGNED' ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Zimmetli
                                            </span>
                                        ) : (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">Müsait</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {asset.assignedTo ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 text-xs font-bold">
                                                    {asset.assignedTo.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-medium text-xs">{asset.assignedTo.name}</span>
                                                    <span className="text-slate-400 text-[10px]">{format(new Date(asset.assignedDate), 'd MMM yyyy', { locale: tr })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {asset.status === 'ASSIGNED' ? (
                                            <button
                                                onClick={() => handleReturn(asset.id)}
                                                className="text-red-600 hover:text-red-700 font-medium text-xs border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded transition"
                                            >
                                                Zimmeti Al
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setAssignModal(asset)}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-xs border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded transition"
                                            >
                                                Zimmetle
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Yeni Demirbaş Ekle</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı / Marka Model</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: MacBook Pro M2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Seri No (Opsiyonel)</label>
                                <input className="w-full border rounded-lg p-2" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="S/N: C02..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="LAPTOP">Laptop / PC</option>
                                        <option value="PHONE">Telefon / Tablet</option>
                                        <option value="CAR">Araç</option>
                                        <option value="KEY">Anahtar / Kart</option>
                                        <option value="OTHER">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Durum</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="AVAILABLE">Müsait</option>
                                        <option value="MAINTENANCE">Bakımda</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                                <textarea className="w-full border rounded-lg p-2 h-20" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Ek bilgiler..." />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN MODAL */}
            {assignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold mb-2">Zimmetle: {assignModal.name}</h2>
                        <p className="text-sm text-slate-500 mb-4">Bu demirbaşı kime zimmetlemek istiyorsunuz?</p>

                        <div className="space-y-4">
                            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                                {users.filter(u => u.role === 'STAFF').map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleAssign(assignModal.id, user.id)}
                                        className="w-full p-3 text-left hover:bg-slate-50 flex items-center gap-3 transition"
                                    >
                                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.phone}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setAssignModal(null)} className="w-full py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
