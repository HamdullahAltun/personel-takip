"use client";

import { useState, useEffect } from "react";
import { Book, Plus, Trash2, Search, FileText, ShieldCheck, HelpCircle, Loader2, Star, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KnowledgeBasePage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [newDoc, setNewDoc] = useState({
        title: "",
        content: "",
        type: "POLICY",
        tags: "",
        requiresSigning: false
    });

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/knowledge');
            const data = await res.json();
            setDocs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/knowledge', {
                method: 'POST',
                body: JSON.stringify(newDoc),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setIsAdding(false);
                setNewDoc({ title: "", content: "", type: "POLICY", tags: "", requiresSigning: false });
                fetchDocs();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu dokümanı silmek istediğinize emin misiniz? AI artık bu bilgiye erişemeyecek.")) return;
        await fetch('/api/admin/knowledge', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchDocs();
    };

    const filteredDocs = docs.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.content.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Book className="h-6 w-6 text-indigo-600" />
                        Şirket Hafızası & Bilgi Bankası
                    </h1>
                    <p className="text-slate-500 font-medium">AI asistanın cevap verebilmesi için kılavuz ve dokümanları buraya ekleyin</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100 transition active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Doküman Ekle
                </button>
                <a
                    href="/admin/knowledge/signatures"
                    className="bg-white text-slate-700 px-6 py-2.5 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                >
                    <ShieldCheck className="h-5 w-5" />
                    İmza Raporları
                </a>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Yeni Bilgi Girişi</h2>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Doküman Başlığı</label>
                                <input
                                    required
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    placeholder="Örn: Kıyafet Yönetmeliği 2024"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                                <select
                                    value={newDoc.type}
                                    onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                >
                                    <option value="POLICY">Yönetmelik / Politika</option>
                                    <option value="MANUAL">Kullanım Kılavuzu</option>
                                    <option value="GUIDELINE">Genel Bilgi</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                            <input
                                type="checkbox"
                                id="requiresSigning"
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={newDoc.requiresSigning}
                                onChange={e => setNewDoc({ ...newDoc, requiresSigning: e.target.checked })}
                            />
                            <label htmlFor="requiresSigning" className="text-sm font-bold text-slate-700">Bu belge imzalanmalı (Zorunlu Okuma)</label>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">İçerik (AI burayı okuyacak)</label>
                            <textarea
                                required
                                rows={8}
                                value={newDoc.content}
                                onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                                placeholder="Doküman içeriğini veya önemli maddeleri buraya yapıştırın..."
                                className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 font-bold">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition">İptal</button>
                            <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition">Kaydet ve İndeksle</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Şirket hafızasında ara..."
                    className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700"
                />
            </div>

            {/* AI Search Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Star className="w-40 h-40" />
                </div>
                <h3 className="text-sm font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> AI Asistan'a Sor
                </h3>
                <div className="flex gap-2 relative z-10">
                    <input
                        className="flex-1 p-3 rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-white/80 backdrop-blur-sm"
                        placeholder="Örn: Yemek ücreti ne kadar? veya İzin politikası nedir?"
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                const input = e.target as HTMLInputElement;
                                if (!input.value.trim()) return;
                                const btn = document.getElementById('ai-ask-btn');
                                btn?.click();
                            }
                        }}
                        id="ai-question-input"
                    />
                    <button
                        id="ai-ask-btn"
                        onClick={async () => {
                            const input = document.getElementById('ai-question-input') as HTMLInputElement;
                            const question = input.value;
                            if (!question.trim()) return;

                            const answerBox = document.getElementById('ai-answer-box');
                            if (answerBox) {
                                answerBox.classList.remove('hidden');
                                answerBox.innerHTML = '<div class="flex items-center gap-2 text-indigo-600"><div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> Düşünüyor...</div>';
                            }

                            try {
                                const res = await fetch('/api/knowledge/ai-search', {
                                    method: 'POST',
                                    body: JSON.stringify({ query: question }),
                                    headers: { 'Content-Type': 'application/json' }
                                });
                                const data = await res.json();
                                if (answerBox) {
                                    answerBox.innerHTML = `
                                        <div class="space-y-2">
                                            <p class="text-sm text-slate-700 leading-relaxed font-medium">${data.answer}</p>
                                        </div>
                                    `;
                                }
                            } catch (e) {
                                if (answerBox) answerBox.innerText = "Bir hata oluştu.";
                            }
                        }}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        <Sparkles className="w-5 h-5" />
                        Sor
                    </button>
                </div>
                <div id="ai-answer-box" className="hidden mt-4 p-4 bg-white/60 backdrop-blur rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="col-span-full text-center p-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 max-w-sm mx-auto">
                        <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">Henüz kaydedilmiş bilgi yok.</p>
                    </div>
                ) : (
                    filteredDocs.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-[32px] border border-slate-200 p-6 hover:shadow-xl transition-all group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn(
                                    "p-3 rounded-2xl",
                                    doc.type === 'POLICY' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    <FileText className="h-6 w-6" />
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                            <h3 className="font-black text-slate-900 mb-2">{doc.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">{doc.content}</p>
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                    {doc.type}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 ml-auto">
                                    {new Date(doc.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="p-5 bg-indigo-500/20 rounded-[32px] backdrop-blur-sm border border-indigo-400/30">
                        <ShieldCheck className="h-10 w-10 text-indigo-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black mb-2 tracking-tight">AI Nasıl Kullanıyor?</h2>
                        <p className="text-indigo-200/80 font-medium max-w-xl text-sm leading-relaxed">
                            Eklediğiniz her doküman, AI asistan tarafından "retrieve" edilir. Bir personel "Şirket kıyafet yönetmeliği nedir?" diye sorduğunda, AI buradaki verileri kullanarak en doğru cevabı verir.
                        </p>
                    </div>
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
