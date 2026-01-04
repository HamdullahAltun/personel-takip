"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingBag, Edit2, X, Image as ImageIcon } from "lucide-react";

type Reward = {
    id: string;
    title: string;
    description: string;
    cost: number;
    stock: number;
    image: string;
    isActive: boolean;
};

export default function AdminRewardShop() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        cost: 100,
        stock: 10,
        image: "gift"
    });

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        const res = await fetch("/api/rewards");
        if (res.ok) setRewards(await res.json());
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/rewards", {
            method: "POST",
            body: JSON.stringify(formData),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            setShowModal(false);
            setFormData({ title: "", description: "", cost: 100, stock: 10, image: "gift" });
            fetchRewards();
        } else {
            alert("Hata oluştu");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu ödülü silmek istiyor musunuz?")) return;
        // Assuming DELETE endpoint exists or needs to be added
        // For now, we'll just hide it or call a delete API if available
        // await fetch(\`/api/rewards?id=\${id}\`, { method: 'DELETE' });
        // fetchRewards();
        alert("Silme fonksiyonu henüz API'de aktif değil.");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingBag className="h-6 w-6 text-indigo-600" />
                        Ödül Mağazası Yönetimi
                    </h1>
                    <p className="text-slate-500">Personelin puan harcayabileceği ödülleri yönetin.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Ürün Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map(reward => (
                    <div key={reward.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-slate-50 rounded-lg">
                                    {/* Icon placeholder logic */}
                                    <ShoppingBag className="h-6 w-6 text-slate-400" />
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-lg text-indigo-600">{reward.cost} P</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${reward.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Stok: {reward.stock === -1 ? 'Sınırsız' : reward.stock}
                                    </span>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900">{reward.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{reward.description}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end gap-2">
                            <button onClick={() => handleDelete(reward.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Yeni Ödül Ekle</h2>
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 p-1.5 rounded-full hover:bg-slate-200"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Adı</label>
                                <input required className="w-full border p-2 rounded-lg" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                                <textarea required className="w-full border p-2 rounded-lg" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Puan Değeri</label>
                                    <input type="number" required className="w-full border p-2 rounded-lg" value={formData.cost} onChange={e => setFormData({ ...formData, cost: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stok (-1 Sınırsız)</label>
                                    <input type="number" required className="w-full border p-2 rounded-lg" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">İkon Tipi</label>
                                <select className="w-full border p-2 rounded-lg" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })}>
                                    <option value="gift">Hediye Paketi</option>
                                    <option value="coffee">Kahve</option>
                                    <option value="ticket">Bilet / Kupon</option>
                                    <option value="time">İzin / Zaman</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">Kaydet</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
