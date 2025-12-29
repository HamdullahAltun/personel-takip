"use client";

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAnnouncements = async () => {
        const res = await fetch('/api/announcements');
        if (res.ok) {
            setAnnouncements(await res.json());
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await fetch('/api/announcements', {
            method: 'POST',
            body: JSON.stringify({ title, content }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setTitle('');
            setContent('');
            fetchAnnouncements();
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-blue-600" />
                Duyuru Yönetimi
            </h1>

            {/* Create Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Yeni Duyuru Oluştur</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                        <input
                            required
                            className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                            placeholder="Örn: Ofis Tadilat Çalışması Hakkında"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">İçerik</label>
                        <textarea
                            required
                            rows={3}
                            className="w-full border border-slate-300 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                            placeholder="Duyuru metnini buraya giriniz..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Yayınlanıyor...' : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    Yayınla
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Current Announcements */}
            <h2 className="text-lg font-bold text-slate-800 mt-8">Aktif Duyurular</h2>
            <div className="grid gap-4">
                {announcements.map((ann) => (
                    <div key={ann.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{ann.title}</h3>
                                <div className="flex items-center gap-4 mt-2 mb-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(ann.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
                                    </span>
                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Yayında
                                    </span>
                                </div>
                                <p className="text-slate-600">{ann.content}</p>
                            </div>

                            {/* Delete (Mock functionality for now as API delete isn't implemented) */}
                            <button className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {announcements.length === 0 && (
                    <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                        <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>Henüz aktif bir duyuru bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
