"use client";

import { useState } from "react";
import { Package, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function InventoryRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        itemName: "",
        quantity: 1,
        reason: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/staff/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("İstek oluşturulamadı");

            toast.success("Malzeme talebiniz alındı!");
            router.push("/dashboard");
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-8 px-4 animate-in fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                    <Package className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Malzeme Talebi</h1>
                    <p className="text-slate-500 text-sm">İhtiyacın olan ekipmanları buradan isteyebilirsin.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ürün / Malzeme Adı</label>
                    <input
                        required
                        type="text"
                        placeholder="Örn: Kablosuz Mouse, Not Defteri..."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        value={formData.itemName}
                        onChange={e => setFormData({ ...formData, itemName: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Adet</label>
                    <input
                        required
                        type="number"
                        min="1"
                        max="10"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        value={formData.quantity}
                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Talep Nedeni</label>
                    <textarea
                        required
                        rows={3}
                        placeholder="Neden bu malzemeye ihtiyacın var?"
                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    Talebi Gönder
                </button>
            </form>
        </div>
    );
}
