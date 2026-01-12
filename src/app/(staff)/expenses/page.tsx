"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import {
    Receipt,
    Plus,
    Calendar,
    FileText,
    Loader2,
    ScanLine,
    Upload,
    Building2,
    Briefcase
} from "lucide-react";

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]); // New state for projects
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        date: format(new Date(), "yyyy-MM-dd"),
        category: "Food",
        projectId: "" // New field
    });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [expRes, projRes] = await Promise.all([
                fetch("/api/staff/expenses"),
                fetch("/api/admin/finance/projects") // We need a route to fetch projects list
            ]);

            if (expRes.ok) {
                const data = await expRes.json();
                setExpenses(data);
            }
            // If project route doesn't exist yet, we might fail silently or handle it
            if (projRes.ok) {
                const pData = await projRes.json();
                setProjects(pData.projects || []); // Assuming structure
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Upload receipt first if exists
            let receiptUrl = "";
            if (receiptFile) {
                const formData = new FormData();
                formData.append("file", receiptFile);
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    receiptUrl = data.url;
                }
            }

            // Create Expense
            const res = await fetch("/api/staff/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    receiptImage: receiptUrl
                })
            });

            if (!res.ok) throw new Error("Masraf kaydedilemedi");

            toast.success("Masraf başarıyla eklendi");
            setShowForm(false);
            setFormData({
                description: "",
                amount: "",
                date: format(new Date(), "yyyy-MM-dd"),
                category: "Food",
                projectId: ""
            });
            setReceiptFile(null);
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Masraf Yönetimi</h1>
                    <p className="text-slate-500 text-sm">Harcamalarını buradan takip edebilirsin.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Masraf
                </button>
            </div>

            {/* New Expense Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-lg text-slate-800 mb-4">Yeni Masraf Ekle</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Örn: Müşteri Yemeği"
                                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tutar (TL)</label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                            <select
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Food">Yemek & Gıda</option>
                                <option value="Travel">Seyahat & Ulaşım</option>
                                <option value="Equipment">Ekipman</option>
                                <option value="Hotel">Konaklama</option>
                                <option value="Other">Diğer</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    required
                                    type="date"
                                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Project Selector */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Proje (Opsiyonel)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <select
                                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                    value={formData.projectId}
                                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                                >
                                    <option value="">Proje Seçiniz...</option>
                                    {projects.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fiş/Fatura Görseli</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {receiptFile ? (
                                    <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                        <FileText className="h-5 w-5" />
                                        {receiptFile.name}
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 mb-2 text-slate-300" />
                                        <span className="text-sm">Görsel yüklemek için tıklayın</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            disabled={isSubmitting}
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                            Kaydet
                        </button>
                    </div>
                </form>
            )}

            {/* Expenses List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {expenses.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Henüz masraf kaydı bulunmuyor.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {expenses.map((expense: any) => (
                            <div key={expense.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                                        <Receipt className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{expense.description}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(expense.date), "d MMMM yyyy", { locale: tr })}
                                            </span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span>{expense.category}</span>
                                            {expense.project && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                                        <Briefcase className="h-3 w-3" />
                                                        {expense.project.title}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 text-lg">
                                        ₺{expense.amount.toFixed(2)}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1
                                        ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            expense.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'}`}>
                                        {expense.status === 'APPROVED' ? 'Onaylandı' :
                                            expense.status === 'REJECTED' ? 'Reddedildi' : 'Beklemede'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
