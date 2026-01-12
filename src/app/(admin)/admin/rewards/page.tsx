"use client";

import { useState, useEffect } from "react";
import { Gift, Coins, Plus, Check, X, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminRewardsPage() {
    const [activeTab, setActiveTab] = useState<'SHOP' | 'REQUESTS'>('REQUESTS');
    const [rewards, setRewards] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New Reward Form
    const [isAdding, setIsAdding] = useState(false);
    const [newReward, setNewReward] = useState({ title: '', cost: '', stock: '', description: '', image: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rewardsRes, requestsRes] = await Promise.all([
                fetch("/api/rewards"),
                fetch("/api/rewards/requests")
            ]);
            if (rewardsRes.ok) setRewards(await rewardsRes.json());
            if (requestsRes.ok) setRequests(await requestsRes.json());
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReward = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/rewards", {
            method: "POST",
            body: JSON.stringify(newReward)
        });
        if (res.ok) {
            setIsAdding(false);
            setNewReward({ title: '', cost: '', stock: '', description: '', image: '' });
            fetchData();
        }
    };

    const handleRequestAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(status === 'APPROVED' ? "Onaylamak istiyor musunuz?" : "Reddetmek istiyor musunuz?")) return;

        const res = await fetch(`/api/rewards/requests/${id}`, {
            method: "PUT",
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            fetchData();
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/rewards?id=${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success("Ürün silindi");
                fetchData();
            } else {
                toast.error("Silme işlemi başarısız");
            }
        } catch (e) {
            toast.error("Bir hata oluştu");
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Ödül Yönetimi</h1>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'REQUESTS' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Talepler
                        {requests.filter(r => r.status === 'PENDING').length > 0 && (
                            <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                                {requests.filter(r => r.status === 'PENDING').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('SHOP')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'SHOP' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Mağaza Ürünleri
                    </button>
                </div>
            </div>

            {activeTab === 'REQUESTS' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Personel</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Ödül</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Tarih</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Durum</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-900">{req.user.name}</td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            {/* <img src={req.reward.image} className="w-8 h-8 rounded-lg bg-slate-100 object-cover" /> */}
                                            <span>{req.reward.title}</span>
                                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">{req.reward.cost} P</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">{format(new Date(req.createdAt), 'd MMM HH:mm', { locale: tr })}</td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {req.status === 'PENDING' ? 'Bekliyor' : req.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'PENDING' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleRequestAction(req.id, 'APPROVED')}
                                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100" title="Onayla">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req.id, 'REJECTED')}
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reddet">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">Henüz talep yok.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'SHOP' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Ürün Ekle
                        </button>
                    </div>

                    {isAdding && (
                        <form onSubmit={handleCreateReward} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ürün Adı</label>
                                    <input required className="w-full border rounded-lg p-2" value={newReward.title} onChange={e => setNewReward({ ...newReward, title: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Puan Değeri</label>
                                    <input required type="number" className="w-full border rounded-lg p-2" value={newReward.cost} onChange={e => setNewReward({ ...newReward, cost: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Stok (-1 Sınırsız)</label>
                                    <input required type="number" className="w-full border rounded-lg p-2" value={newReward.stock} onChange={e => setNewReward({ ...newReward, stock: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Görsel (Emoji/URL)</label>
                                    <input className="w-full border rounded-lg p-2" placeholder="gift, coffee, ticket..." value={newReward.image} onChange={e => setNewReward({ ...newReward, image: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                                <textarea className="w-full border rounded-lg p-2" rows={2} value={newReward.description} onChange={e => setNewReward({ ...newReward, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rewards.map(reward => (
                            <div key={reward.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group">
                                <div>
                                    <h3 className="font-bold text-slate-900">{reward.title}</h3>
                                    <p className="text-sm text-slate-500">{reward.description}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold">{reward.cost} Puan</span>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">Stok: {reward.stock === -1 ? 'Sınırsız' : reward.stock}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* <button className="p-2 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button> */}
                                    <button
                                        onClick={() => handleDeleteReward(reward.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
