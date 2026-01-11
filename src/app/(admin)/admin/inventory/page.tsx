"use client";

import { useState, useEffect } from "react";
import { Package, Plus, AlertTriangle, ArrowRightLeft, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function InventoryPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/inventory')
            .then(res => res.json())
            .then(data => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(e => setLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Envanter & Stok</h1>
                    <p className="text-slate-500 text-sm">Ofis malzemeleri ve demirbaş takibi.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer
                    </button>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Ürün Ekle
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center gap-3 mb-2 opacity-80">
                        <Package className="h-5 w-5" />
                        <span className="font-medium">Toplam Ürün</span>
                    </div>
                    <div className="text-3xl font-bold">{items.length}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-2 text-slate-500">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Kritik Stok</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-500">
                        {items.filter(i => i.quantity <= i.minQuantity).length}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Sipariş verilmesi gerekenler</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    placeholder="Ürün adı veya SKU ile ara..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="p-4">Ürün Adı</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4">Konum</th>
                            <th className="p-4">Stok</th>
                            <th className="p-4">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                        ) : items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition">
                                <td className="p-4">
                                    <div className="font-medium text-slate-900">{item.name}</div>
                                    <div className="text-xs text-slate-400">SKU: {item.sku || '-'}</div>
                                </td>
                                <td className="p-4">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{item.category}</span>
                                </td>
                                <td className="p-4 text-slate-500">{item.location || '-'}</td>
                                <td className="p-4 font-bold text-slate-900">{item.quantity} {item.unit}</td>
                                <td className="p-4">
                                    {item.quantity <= item.minQuantity ? (
                                        <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold w-fit">
                                            <AlertTriangle className="h-3 w-3" /> Kritik
                                        </span>
                                    ) : (
                                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold w-fit">Yeterli</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
