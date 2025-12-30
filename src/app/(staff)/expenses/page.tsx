"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Receipt, Plus, Upload, Trash2, AlertCircle, CheckCircle, XCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

type Expense = {
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    receiptImage?: string;
};

export default function StaffExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form
    const [desc, setDesc] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState("Yemek");
    const [receiptImage, setReceiptImage] = useState<string | null>(null);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            if (res.ok) setExpenses(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate Type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                alert("Sadece resim dosyaları (JPG, PNG, WEBP, GIF) yüklenebilir.");
                return;
            }

            // Limit to 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `/api/expenses/${editingId}` : '/api/expenses';

            const res = await fetch(url, {
                method,
                body: JSON.stringify({
                    description: desc,
                    amount: parseFloat(amount),
                    date,
                    category,
                    receiptImage
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setShowModal(false);
                fetchExpenses();
                resetForm();
            }
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const resetForm = () => {
        setDesc("");
        setAmount("");
        setReceiptImage(null);
        setEditingId(null);
        setCategory("Yemek");
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setDesc(expense.description);
        setAmount(expense.amount.toString());
        setDate(expense.date.split('T')[0]);
        setCategory(expense.category || "Yemek");
        setReceiptImage(expense.receiptImage || null);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Silmek istiyor musunuz?")) return;
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        fetchExpenses();
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <Receipt className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Harcamalarım</h1>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 active:scale-95 transition"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {expenses.length === 0 && !loading && (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400">Henüz harcama kaydı yok.</p>
                </div>
            )}

            <div className="space-y-3">
                {expenses.map(expense => (
                    <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden">
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                            expense.status === 'APPROVED' ? 'bg-green-500' :
                                expense.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />

                        <div className="pl-3">
                            <div className="text-xs text-slate-400 mb-0.5">
                                {format(new Date(expense.date), "d MMMM yyyy", { locale: tr })} • {expense.category}
                            </div>
                            <h3 className="font-bold text-slate-800">{expense.description}</h3>
                            {expense.status === 'REJECTED' && (
                                <p className="text-xs text-red-500 mt-1">Red sebebi: {expense.rejectionReason}</p>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-lg text-slate-900">{expense.amount} ₺</div>
                            <div className={cn("text-xs font-bold inline-flex items-center gap-1",
                                expense.status === 'APPROVED' ? 'text-green-600' :
                                    expense.status === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'
                            )}>
                                {expense.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
                                {expense.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                                {expense.status === 'PENDING' && <AlertCircle className="h-3 w-3" />}
                                {expense.status === 'APPROVED' ? 'Onaylandı' : expense.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor'}
                            </div>
                        </div>

                        {expense.status === 'PENDING' && (
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={() => handleEdit(expense)} className="p-1.5 text-slate-300 hover:text-blue-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                </button>
                                <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-slate-300 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Harcamayı Düzenle' : 'Yeni Harcama'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Hidden field for ID if needed for debugging, but using state */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Açıklama</label>
                                <input className="w-full border rounded-lg p-2 mt-1" required value={desc} onChange={e => setDesc(e.target.value)} placeholder="Örn: Müşteri Yemeği" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tutar (₺)</label>
                                    <input type="number" step="0.01" className="w-full border rounded-lg p-2 mt-1" required value={amount} onChange={e => setAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tarih</label>
                                    <input type="date" className="w-full border rounded-lg p-2 mt-1" required value={date} onChange={e => setDate(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                                <select className="w-full border rounded-lg p-2 mt-1" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option>Yemek</option>
                                    <option>Ulaşım</option>
                                    <option>Konaklama</option>
                                    <option>Ekipman</option>
                                    <option>Diğer</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Fiş/Fatura Görseli (Opsiyonel)</label>
                                <div className="space-y-3">
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {receiptImage ? (
                                            <div className="relative h-32 mx-auto">
                                                <img src={receiptImage} alt="Preview" className="h-full mx-auto object-contain" />
                                            </div>
                                        ) : (
                                            <div className="text-slate-400 py-4">
                                                <Upload className="h-8 w-8 mx-auto mb-2" />
                                                <span className="text-sm">Görsel Yükle</span>
                                            </div>
                                        )}
                                    </div>
                                    {receiptImage && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                const btn = document.getElementById('ocr-btn');
                                                if (btn) btn.innerText = "Taranıyor...";
                                                try {
                                                    const res = await fetch("/api/ai/ocr-expense", {
                                                        method: "POST",
                                                        body: JSON.stringify({ image: receiptImage })
                                                    });
                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        setAmount(data.amount?.toString() || "");
                                                        setDate(data.date || date);
                                                        setDesc(data.description || desc);
                                                        setCategory(data.category || category);
                                                    }
                                                } finally {
                                                    if (btn) btn.innerText = "Sihirli Tarama (AI)";
                                                }
                                            }}
                                            id="ocr-btn"
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 hover:bg-indigo-100 transition"
                                        >
                                            <BrainCircuit className="w-4 h-4" />
                                            Sihirli Tarama (AI)
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={submitting} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 mt-2">
                                {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
