
"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Minus, Search, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalMode, setModalMode] = useState<'ADD' | 'TRANSACTION' | null>(null);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [newItem, setNewItem] = useState({ name: "", category: "OFFICE", quantity: 0, minQuantity: 5, unit: "PCS", location: "" });
    const [transaction, setTransaction] = useState({ type: "OUT", quantity: 1, reason: "" });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await fetch("/api/admin/inventory");
            if (res.ok) setItems(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem)
            });
            if (res.ok) {
                toast.success("Ürün eklendi");
                setModalMode(null);
                fetchInventory();
            }
        } catch (e) {
            toast.error("Hata oluştu");
        }
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        try {
            const res = await fetch("/api/admin/inventory/transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: selectedItem.id,
                    ...transaction
                })
            });
            if (res.ok) {
                toast.success("Stok güncellendi");
                setModalMode(null);
                fetchInventory();
            }
        } catch (e) {
            toast.error("Hata oluştu");
        }
    };

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Envanter Takibi</h1>
                    <p className="text-slate-500">Demirbaş ve sarf malzemelerini yönetin.</p>
                </div>
                <button
                    onClick={() => { setModalMode('ADD'); setNewItem({ name: "", category: "OFFICE", quantity: 0, minQuantity: 5, unit: "PCS", location: "" }); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Ürün
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Toplam Kalem</div>
                    <div className="text-2xl font-bold text-slate-900">{items.length}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Düşük Stok</div>
                    <div className="text-2xl font-bold text-red-600">
                        {items.filter(i => i.quantity <= i.minQuantity).length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">Toplam Adet</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {items.reduce((acc, curr) => acc + curr.quantity, 0)}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    placeholder="Ürün ara..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="p-4">Ürün Adı</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4">Konum</th>
                            <th className="p-4">Stok</th>
                            <th className="p-4 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr>
                        ) : filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-slate-400" />
                                    {item.name}
                                    {item.quantity <= item.minQuantity && (
                                        <div className="text-red-500" title="Stok Az">
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-slate-600">{item.category}</td>
                                <td className="p-4 text-slate-500">{item.location || "-"}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.quantity <= item.minQuantity ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                        }`}>
                                        {item.quantity} {item.unit}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => { setSelectedItem(item); setTransaction({ type: 'IN', quantity: 1, reason: '' }); setModalMode('TRANSACTION'); }}
                                            className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Stok Ekle"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedItem(item); setTransaction({ type: 'OUT', quantity: 1, reason: '' }); setModalMode('TRANSACTION'); }}
                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Stok Düş"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                                            <History className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {modalMode === 'ADD' && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Ürün Ekle</h2>
                        <form onSubmit={handleCreateItem} className="space-y-4">
                            <input required placeholder="Ürün Adı" className="w-full border p-2 rounded-lg" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            <select className="w-full border p-2 rounded-lg" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}>
                                <option value="OFFICE">Ofis</option>
                                <option value="ELECTRONICS">Elektronik</option>
                                <option value="KITCHEN">Mutfak</option>
                                <option value="Consumables">Sarf Malzeme</option>
                            </select>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Başlangıç Stok" className="w-1/2 border p-2 rounded-lg" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} />
                                <input type="number" placeholder="Min Limit" className="w-1/2 border p-2 rounded-lg" value={newItem.minQuantity} onChange={e => setNewItem({ ...newItem, minQuantity: Number(e.target.value) })} />
                            </div>
                            <input placeholder="Birim (Adet, Kutu)" className="w-full border p-2 rounded-lg" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} />
                            <input placeholder="Konum (Raf, Oda)" className="w-full border p-2 rounded-lg" value={newItem.location} onChange={e => setNewItem({ ...newItem, location: e.target.value })} />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-slate-500">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modalMode === 'TRANSACTION' && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95">
                        <h2 className={`text-xl font-bold mb-4 ${transaction.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'IN' ? 'Stok Ekle' : 'Stok Düş'} - {selectedItem.name}
                        </h2>
                        <form onSubmit={handleTransaction} className="space-y-4">
                            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                                <button type="button" onClick={() => setTransaction({ ...transaction, type: 'IN' })} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${transaction.type === 'IN' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'}`}>Giriş</button>
                                <button type="button" onClick={() => setTransaction({ ...transaction, type: 'OUT' })} className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-colors ${transaction.type === 'OUT' ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}>Çıkış</button>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Miktar</label>
                                <input type="number" required min="1" className="w-full border p-2 rounded-lg" value={transaction.quantity} onChange={e => setTransaction({ ...transaction, quantity: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Açıklama / Sebep</label>
                                <input required placeholder="Örn: Satın alma, Tüketim, Kayıp" className="w-full border p-2 rounded-lg" value={transaction.reason} onChange={e => setTransaction({ ...transaction, reason: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalMode(null)} className="px-4 py-2 text-slate-500">İptal</button>
                                <button type="submit" className={`px-4 py-2 text-white rounded-lg ${transaction.type === 'IN' ? 'bg-green-600' : 'bg-red-600'}`}>Onayla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
