"use client";

import { useState, useEffect } from "react";
import { Star, Award, TrendingUp, Plus, User } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function PerformancePage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({ revieweeId: "", period: "2024-Q1", score: 50, feedback: "" });

    useEffect(() => {
        fetchData();
        fetch('/api/users').then(r => r.json()).then(setUsers);
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/performance');
            const data = await res.json();
            setReviews(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/performance', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ revieweeId: "", period: "2024-Q1", score: 50, feedback: "" });
        fetchData();
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
        if (score >= 70) return "text-blue-600 bg-blue-50 border-blue-200";
        if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Performans Yönetimi</h1>
                    <p className="text-slate-500">Personel değerlendirmeleri ve hedefler</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Değerlendirme
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Toplam Değerlendirme</p>
                        <h3 className="text-2xl font-bold text-slate-900">{reviews.length}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                        <Star className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Yüksek Performans</p>
                        <h3 className="text-2xl font-bold text-slate-900">{reviews.filter(r => r.score >= 90).length}</h3>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Ortalama Puan</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {reviews.length > 0 ? (reviews.reduce((a, b) => a + b.score, 0) / reviews.length).toFixed(1) : 0}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-sm">
                                    {review.reviewee.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 line-clamp-1">{review.reviewee.name}</h3>
                                    <p className="text-xs text-slate-500">{review.reviewee.role}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${getScoreColor(review.score)}`}>
                                {review.score} Puan
                            </span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg flex-1">
                            <p className="text-sm text-slate-600 italic">"{review.feedback}"</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                            <span>Dönem: <span className="font-semibold text-slate-600">{review.period}</span></span>
                            <span>Değerlendiren: {review.reviewer.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Performans Değerlendirmesi</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2.5 bg-slate-50"
                                    value={formData.revieweeId}
                                    onChange={e => setFormData({ ...formData, revieweeId: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Dönem</label>
                                    <select
                                        className="w-full border rounded-lg p-2.5 bg-slate-50"
                                        value={formData.period}
                                        onChange={e => setFormData({ ...formData, period: e.target.value })}
                                    >
                                        <option value="2024-Q1">2024 - 1. Çeyrek</option>
                                        <option value="2024-Q2">2024 - 2. Çeyrek</option>
                                        <option value="2024-Q3">2024 - 3. Çeyrek</option>
                                        <option value="2024-Q4">2024 - 4. Çeyrek</option>
                                        <option value="2025-Q1">2025 - 1. Çeyrek</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Puan (0-100)</label>
                                    <input
                                        type="number" min="0" max="100" required
                                        className="w-full border rounded-lg p-2.5 bg-slate-50 font-mono"
                                        value={formData.score}
                                        onChange={e => setFormData({ ...formData, score: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Geri Bildirim & Notlar</label>
                                <textarea
                                    required
                                    className="w-full border rounded-lg p-3 h-32 bg-slate-50"
                                    placeholder="Personelin güçlü ve zayıf yönleri..."
                                    value={formData.feedback}
                                    onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                                />
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
