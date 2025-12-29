"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, FileCheck, Trash2, Globe, FileClock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({ userId: "", title: "", type: "CONTRACT", fileUrl: "" });

    useEffect(() => {
        fetchData();
        fetch('/api/users').then(r => r.json()).then(setUsers);
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/documents');
            const data = await res.json();
            setDocuments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/documents', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ userId: "", title: "", type: "CONTRACT", fileUrl: "" });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Belgeyi silmek istediğinize emin misiniz?")) return;
        await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Belge Yönetimi</h1>
                    <p className="text-slate-500">Personel özlük dosyaları ve sözleşmeler</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Belge Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.length > 0 ? (
                    documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <button onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-500 transition">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg mb-1">{doc.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{doc.type}</p>

                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                                    {doc.user.name.charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-slate-700">{doc.user.name}</span>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                <span className="text-xs text-slate-400">{format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: tr })}</span>
                                <Link
                                    href={doc.fileUrl}
                                    target="_blank"
                                    className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"
                                >
                                    <Globe className="h-3 w-3" />
                                    Görüntüle
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        Henüz belge yüklenmemiş.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Belge Ekle</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                                    value={formData.userId}
                                    onChange={e => setFormData({ ...formData, userId: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Belge Adı</label>
                                <input
                                    required placeholder="Örn: İş Sözleşmesi"
                                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                                <select
                                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="CONTRACT">Sözleşme</option>
                                    <option value="ID">Kimlik Fotokopisi</option>
                                    <option value="DIPLOMA">Diploma</option>
                                    <option value="REPORT">Sağlık Raporu</option>
                                    <option value="OTHER">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Dosya Linki (URL)</label>
                                <input
                                    required placeholder="https://..."
                                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                                    value={formData.fileUrl}
                                    onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Not: Şimdilik sadece harici link (Google Drive, Dropbox vb.) desteklenmektedir.</p>
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
