"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, AlertCircle, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            if (res.ok) setExpenses(await res.json());
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
        // Optimistic
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: status as any, rejectionReason: reason } : e));
        setRejectingId(null);
        setRejectReason("");

        await fetch(`/api/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status, rejectionReason: reason }),
            headers: { 'Content-Type': 'application/json' }
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Harcama Onayları</h1>

            <div className="grid gap-4">
                {expenses.map(expense => (
                    <div key={expense.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                        {/* Receipt Image Thumbnail */}
                        <div className="w-full md:w-32 h-32 bg-slate-100 rounded-lg flex-shrink-0 relative group cursor-pointer overflow-hidden"
                            onClick={() => expense.receiptImage && setSelectedImage(expense.receiptImage)}>
                            {expense.receiptImage ? (
                                <>
                                    <img src={expense.receiptImage} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Maximize2 className="text-white h-6 w-6" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-2">
                                    Fiş Yok
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-lg text-slate-900">{expense.description}</span>
                                        <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500">{expense.category}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 space-x-2">
                                        <span className="font-semibold text-slate-700">{expense.user.name}</span>
                                        <span>•</span>
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
                            {expense.status === 'PENDING' && (
                                <div className="mt-4 flex gap-3 justify-end border-t pt-4">
                                    {rejectingId === expense.id ? (
                                        <div className="flex items-center gap-2 w-full animate-in slide-in-from-right">
                                            <input
                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                                placeholder="Red sebebi..."
                                                autoFocus
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                            />
                                            <button onClick={() => setRejectingId(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="h-5 w-5" /></button>
                                            <button onClick={() => handleUpdateStatus(expense.id, 'REJECTED', rejectReason)} className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">Reddet</button>
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
                                </div>
                            )}

                            {expense.rejectionReason && (
                                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                    <span className="font-bold">Red Sebebi:</span> {expense.rejectionReason}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {expenses.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-400">
                        Bekleyen veya geçmiş harcama talebi bulunmuyor.
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white">
                        <X className="h-8 w-8" />
                    </button>
                    <img src={selectedImage} className="max-w-full max-h-screen object-contain rounded" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
