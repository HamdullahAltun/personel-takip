"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Star, TrendingUp } from "lucide-react";

export default function PerformancePage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ revieweeId: "", period: "2024-Q1", score: 80, feedback: "" });

    useEffect(() => {
        fetchReviews();
        fetch('/api/users').then(r => r.json()).then(setUsers);
    }, []);

    const fetchReviews = async () => {
        const res = await fetch('/api/performance');
        if (res.ok) setReviews(await res.json());
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/performance', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        fetchReviews();
    }

    // Mock Data for Radar Chart (In real app, calculate averages per category)
    const chartData = [
        { subject: 'İletişim', A: 120, fullMark: 150 },
        { subject: 'Teknik', A: 98, fullMark: 150 },
        { subject: 'Liderlik', A: 86, fullMark: 150 },
        { subject: 'Zamanlama', A: 99, fullMark: 150 },
        { subject: 'Takım Çalışması', A: 85, fullMark: 150 },
        { subject: 'Problem Çözme', A: 65, fullMark: 150 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Performans Yönetimi</h1>
                    <p className="text-slate-500">360 Derece Değerlendirme ve Analizler</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Değerlendir
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 text-center">Şirket Geneli Yetkinlik Haritası</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis />
                                <Radar name="Şirket Ortalaması" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-2 space-y-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900">{review.reviewee.name}</h4>
                                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{review.period}</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-2">Değerlendiren: {review.reviewer.name}</p>
                                <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg italic">"{review.feedback}"</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-indigo-600 text-white w-14 h-14 rounded-xl shadow-lg shadow-indigo-200">
                                <span className="text-xl font-bold">{review.score}</span>
                                <Star className="h-3 w-3 fill-white/50 text-white/50" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h2 className="text-lg font-bold mb-4">Personel Değerlendir</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Personel</label>
                                <select required className="w-full border rounded-lg p-2" value={formData.revieweeId} onChange={e => setFormData({ ...formData, revieweeId: e.target.value })}>
                                    <option value="">Seçiniz...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Dönem</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })}>
                                        <option>2024-Q1</option>
                                        <option>2024-Q2</option>
                                        <option>2024-Q3</option>
                                        <option>2024-Q4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Puan (0-100)</label>
                                    <input type="number" max="100" min="0" required className="w-full border rounded-lg p-2" value={formData.score} onChange={e => setFormData({ ...formData, score: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Geri Bildirim</label>
                                <textarea required className="w-full border rounded-lg p-2 h-24" value={formData.feedback} onChange={e => setFormData({ ...formData, feedback: e.target.value })} placeholder="Güçlü ve zayıf yönler..." />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
