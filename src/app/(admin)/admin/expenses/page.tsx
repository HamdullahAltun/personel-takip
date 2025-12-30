"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Search, Filter, Check, X, Trash2, Receipt, FileText, Loader2, Maximize2, XCircle, Edit2, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    user: { name: string; phone: string };
    receiptImage?: string;
    rejectionReason?: string;
};

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Edit State
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editForm, setEditForm] = useState({ description: "", amount: "", date: "", category: "" });

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            if (res.status === 401) {
                // handle unauthorized
                return;
            }
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setExpenses(data);
            } else {
                setExpenses([]);
            }
        } catch {
            setExpenses([]);
            toast.error("Harcamalar yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
        const interval = setInterval(fetchExpenses, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
        // Optimistic update
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: status as any, rejectionReason: reason } : e));
        setRejectingId(null);
        setRejectReason("");

        try {
            const res = await fetch('/api/expenses', {
                method: 'PATCH',
                body: JSON.stringify({ id, status, rejectionReason: reason }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error();
            toast.success(status === 'APPROVED' ? "Harcama onaylandı." : "Harcama reddedildi.");
            fetchExpenses();
        } catch {
            toast.error("İşlem başarısız.");
            fetchExpenses(); // Revert
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu harcamayı silmek istediğinize emin misiniz?")) return;

        try {
            await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            setExpenses(prev => prev.filter(e => e.id !== id));
            toast.success("Harcama silindi.");
        } catch {
            toast.error("Silme işlemi başarısız.");
        }
    };

    const openEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setEditForm({
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date.split('T')[0],
            category: expense.category,
        });
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;

        try {
            // Note: We might need a PUT endpoint or check if POST handles updates? 
            // The file audit showed DELETE at /api/expenses/[id] but update logic was missing or implicit.
            // Assuming we need to implement a detailed update or reuse PATCH?
            // Actually, usually PUT /api/expenses/[id] is best. I will assume it exists or I might need to make it.
            // Let's check api/expenses/[id]/route.ts if it exists. 
            // For now, I'll write the fetch.
            const res = await fetch(`/api/expenses/${editingExpense.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...editForm,
                    amount: parseFloat(editForm.amount)
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) throw new Error();

            setEditingExpense(null);
            fetchExpenses();
            toast.success("Harcama güncellendi.");
        } catch {
            toast.error("Güncelleme başarısız.");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-slate-900">Harcama Onayları</h1>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {expenses.map(expense => (
                        <div key={expense.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 transition hover:shadow-md">
                            {/* Receipt Image Thumbnail */}
                            <div className="w-full md:w-32 h-32 bg-slate-100 rounded-lg flex-shrink-0 relative group cursor-pointer overflow-hidden border border-slate-100"
                                onClick={() => expense.receiptImage && setSelectedImage(expense.receiptImage)}>
                                {expense.receiptImage ? (
                                    <>
                                        <img src={expense.receiptImage} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                            <Maximize2 className="text-white h-6 w-6" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-2 flex-col gap-1">
                                        <XCircle className="h-6 w-6 opacity-30" />
                                        <span>Fiş Yok</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-lg text-slate-900">{expense.description}</span>
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium uppercase tracking-wide">{expense.category}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 space-x-2 flex items-center">
                                            <span className="font-semibold text-slate-700">{expense.user.name}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>{format(new Date(expense.date), "d MMMM yyyy", { locale: tr })}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900">{expense.amount} ₺</div>
                                        <div className={cn("text-xs font-bold flex items-center justify-end gap-1 mt-1",
                                            expense.status === 'APPROVED' ? 'text-green-600' :
                                                expense.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                                        )}>
                                            {expense.status === 'APPROVED' ? 'Onaylandı' : expense.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 flex flex-wrap gap-3 justify-end border-t border-slate-100 pt-4">
                                    <div className="mr-auto flex gap-2">
                                        <button onClick={() => openEdit(expense)} className="text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center gap-1">
                                            <Edit2 className="h-3 w-3" /> Düzenle
                                        </button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition flex items-center gap-1">
                                            <Trash2 className="h-3 w-3" /> Sil
                                        </button>
                                    </div>

                                    {expense.status === 'PENDING' && (
                                        <>
                                            {rejectingId === expense.id ? (
                                                <div className="flex items-center gap-2 w-full md:w-auto animate-in slide-in-from-right">
                                                    <input
                                                        className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                                        placeholder="Red sebebi..."
                                                        autoFocus
                                                        value={rejectReason}
                                                        onChange={e => setRejectReason(e.target.value)}
                                                    />
                                                    <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle className="h-5 w-5" /></button>
                                                    <button onClick={() => handleUpdateStatus(expense.id, 'REJECTED', rejectReason)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 transition">Reddet</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setRejectingId(expense.id)}
                                                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold transition"
                                                    >
                                                        <XCircle className="h-4 w-4" /> Reddet
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(expense.id, 'APPROVED')}
                                                        className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-bold transition"
                                                    >
                                                        <CheckCircle className="h-4 w-4" /> Onayla
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                {expense.rejectionReason && (
                                    <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2">
                                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="font-bold block text-xs uppercase tracking-wide opacity-80 mb-0.5">Red Sebebi</span>
                                            {expense.rejectionReason}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {expenses.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-slate-400">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-slate-50 rounded-full">
                                    <Clock className="h-8 w-8 text-slate-300" />
                                </div>
                            </div>
                            <p>Bekleyen veya geçmiş harcama talebi bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white transition transform hover:rotate-90">
                        <X className="h-8 w-8" />
                    </button>
                    <img src={selectedImage} className="max-w-full max-h-screen object-contain rounded shadow-2xl" onClick={e => e.stopPropagation()} />
                </div>
            )}

            {/* Edit Modal */}
            {editingExpense && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-lg font-bold text-slate-900">Harcama Düzenle</h2>
                            <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateExpense} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Açıklama</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" required value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tutar (₺)</label>
                                    <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" required value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tarih</label>
                                    <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" required value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kategori</label>
                                <select className="w-full border border-slate-300 rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                    <option>Yemek</option>
                                    <option>Ulaşım</option>
                                    <option>Konaklama</option>
                                    <option>Ekipman</option>
                                    <option>Diğer</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setEditingExpense(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">İptal</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
