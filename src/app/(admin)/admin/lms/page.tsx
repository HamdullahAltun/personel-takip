"use client";

import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, BookOpen, Plus } from "lucide-react";

export default function AdminLMSPage() {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "", url: "", type: "VIDEO" });

    useEffect(() => {
        fetchTrainings();
    }, []);

    const fetchTrainings = async () => {
        const res = await fetch('/api/lms');
        if (res.ok) setTrainings(await res.json());
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/lms', {
            method: 'POST',
            body: JSON.stringify({ action: 'CREATE', ...formData }),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ title: "", description: "", url: "", type: "VIDEO" });
        fetchTrainings();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Eğitim Platformu (LMS)</h1>
                    <p className="text-slate-500">Personel eğitimlerini oluşturun ve takip edin</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Eğitim Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(training => (
                    <div key={training.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition">
                        <div className="aspect-video bg-slate-100 relative group">
                            {training.type === 'VIDEO' ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10 group-hover:bg-indigo-900/20 transition">
                                    <PlayCircle className="h-16 w-16 text-indigo-600 opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/10">
                                    <BookOpen className="h-16 w-16 text-blue-600 opacity-80" />
                                </div>
                            )}
                        </div>
                        <div className="p-5">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded mb-2 inline-block shadow-sm">
                                {training.type === 'VIDEO' ? 'VİDEO EĞİTİM' : 'DÖKÜMAN'}
                            </span>
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-1">{training.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{training.description}</p>

                            <div className="flex items-center gap-2 pt-2 border-t text-sm text-slate-500">
                                <span>Tamamlanma Oranı:</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    {/* Mock Progress */}
                                    <div className="h-full bg-green-500 w-[65%]" />
                                </div>
                                <span className="font-bold text-slate-900">%65</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h2 className="text-lg font-bold mb-4">Yeni Eğitim Ekle</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Eğitim Başlığı</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Örn: İş Güvenliği" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                                <textarea required className="w-full border rounded-lg p-2 h-20" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="İçerik hakkında..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">İçerik URL (Youtube/PDF)</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tip</label>
                                <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="VIDEO">Video</option>
                                    <option value="DOCUMENT">Döküman</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
