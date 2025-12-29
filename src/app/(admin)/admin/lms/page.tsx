"use client";

import { useState, useEffect } from "react";
import { BookOpen, PlayCircle, CheckCircle, FileText, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function LMSPage() {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", url: "", type: "VIDEO" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/lms');
            const data = await res.json();
            setTrainings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/lms', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ title: "", description: "", url: "", type: "VIDEO" });
        fetchData();
    };

    // Note: Completion logic would normally be triggered by watching video end or clicking logic,
    // but for Admin view, we just list content.
    // However, if Admin wants to test:
    const handleComplete = async (id: string) => {
        await fetch('/api/lms', {
            method: 'PATCH',
            body: JSON.stringify({ id, action: 'COMPLETE' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Eğitim Yönetimi (LMS)</h1>
                    <p className="text-slate-500">Personel eğitimleri ve oryantasyon içerikleri</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    İçerik Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(item => {
                    const isCompleted = item.completions && item.completions.length > 0;
                    return (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="h-32 bg-slate-100 flex items-center justify-center relative">
                                {item.type === 'VIDEO' ? <PlayCircle className="h-12 w-12 text-indigo-500 opacity-80" /> : <FileText className="h-12 w-12 text-orange-500 opacity-80" />}
                                {isCompleted && (
                                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Tamamlandı
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{item.description}</p>

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-xs text-slate-400">{format(new Date(item.createdAt), 'd MMM yyyy', { locale: tr })}</span>
                                    <div className="flex gap-2">
                                        <Link href={item.url} target="_blank" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                            <ExternalLink className="h-3 w-3" /> Git
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Eğitim İçeriği</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                                <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="VIDEO">Video</option>
                                    <option value="DOCUMENT">Doküman</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">İçerik Linki (URL)</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://youtube.com/..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                                <textarea required className="w-full border rounded-lg p-2 h-24" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
