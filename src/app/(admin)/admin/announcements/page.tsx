"use client";

import { useState, useEffect } from 'react';
import { Trash2, Megaphone, Plus, AlertCircle } from 'lucide-react';

type Announcement = {
    id: string;
    title: string;
    content: string;
    createdAt: string;
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [createLoading, setCreateLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/announcements');
            const data = await res.json();
            if (Array.isArray(data)) setAnnouncements(data);
        } catch (e) {
            console.error("Fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        setError("");

        try {
            const res = await fetch('/api/announcements', {
                method: 'POST',
                body: JSON.stringify({ title, content }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setTitle("");
                setContent("");
                fetchAnnouncements();
            } else {
                setError("Oluşturulurken bir hata oluştu");
            }
        } catch (e) {
            setError("Hata oluştu");
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
            if (res.ok) fetchAnnouncements();
        } catch (e) {
            console.error("Delete error", e);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-100 rounded-lg">
                    <Megaphone className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Duyuru Yönetimi</h1>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Create Form */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                    <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-green-600" />
                        Yeni Duyuru Ekle
                    </h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                            <input
                                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="Örn: Ofis Tadilat Çalışması"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label>
                            <textarea
                                className="w-full border border-slate-300 rounded-lg p-2 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                required
                                placeholder="Duyuru detayları..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={createLoading}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {createLoading ? "Yayınlanıyor..." : "Yayınla"}
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg text-slate-800">Aktif Duyurular</h2>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Yükleniyor...</div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                            Henüz duyuru yok.
                        </div>
                    ) : (
                        announcements.map(ann => (
                            <div key={ann.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                                <h3 className="font-bold text-slate-900 mb-1">{ann.title}</h3>
                                <p className="text-slate-600 text-sm whitespace-pre-wrap">{ann.content}</p>
                                <div className="mt-3 text-xs text-slate-400">
                                    {new Date(ann.createdAt).toLocaleDateString("tr-TR")}
                                </div>
                                <button
                                    onClick={() => handleDelete(ann.id)}
                                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
