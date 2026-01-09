"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { TrendingUp, CheckCircle, Circle, ArrowRight, Target, Plus, Calendar, MessageSquare, Award, Sparkles } from "lucide-react";
import { tr } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function StaffGoalsPage() {
    const [activeTab, setActiveTab] = useState<'goals' | 'reviews' | 'peer'>('goals');
    const { data: goals = [], mutate } = useSWR('/api/goals', (url) => fetch(url).then(r => r.json()));
    const { data: reviews = [] } = useSWR('/api/performance', (url) => fetch(url).then(r => r.json()));
    const { data: kudos = [] } = useSWR('/api/social?type=kudos', (url) => fetch(url).then(r => r.json()));
    const { data: users = [] } = useSWR('/api/users', (url) => fetch(url).then(r => r.json()));

    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: "", description: "", dueDate: "" });

    // Review Form State
    const [reviewTarget, setReviewTarget] = useState("");
    const [reviewScore, setReviewScore] = useState(5);
    const [reviewFeedback, setReviewFeedback] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/goals', {
            method: 'POST',
            body: JSON.stringify(newGoal),
            headers: { 'Content-Type': 'application/json' }
        });
        mutate();
        setShowModal(false);
        setNewGoal({ title: "", description: "", dueDate: "" });
    };

    const handleProgress = async (id: string, currentStatus: string, currentProgress: number) => {
        let newStatus = currentStatus;
        let newProgress = currentProgress;

        if (currentStatus === 'NOT_STARTED') {
            newStatus = 'IN_PROGRESS';
            newProgress = 25;
        } else if (currentStatus === 'IN_PROGRESS') {
            if (newProgress < 100) newProgress += 25;
            if (newProgress >= 100) newStatus = 'COMPLETED';
        }

        // Optimistic
        mutate(goals.map((g: any) => g.id === id ? { ...g, status: newStatus, progress: newProgress } : g), false);

        await fetch(`/api/goals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus, progress: newProgress }),
            headers: { 'Content-Type': 'application/json' }
        });
        mutate();
    }

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewTarget) return;
        setSubmittingReview(true);
        try {
            await fetch('/api/performance', {
                method: 'POST',
                body: JSON.stringify({ revieweeId: reviewTarget, score: reviewScore, feedback: reviewFeedback }),
                headers: { 'Content-Type': 'application/json' }
            });
            alert("Değerlendirme başarıyla gönderildi.");
            setReviewTarget("");
            setReviewScore(5);
            setReviewFeedback("");
            setActiveTab('reviews');
        } catch (e) {
            alert("Bir hata oluştu.");
        }
        setSubmittingReview(false);
    }

    return (
        <div className="max-w-2xl mx-auto pb-24 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gelişim & Performans</h1>
                    <p className="text-slate-500 text-sm">Hedefleriniz, geri bildirimleriniz ve başarılarınız.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                    onClick={() => setActiveTab('goals')}
                    className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'goals' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    Hedeflerim
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'reviews' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    Değerlendirmeler
                </button>
                <button
                    onClick={() => setActiveTab('peer')}
                    className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'peer' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                    Ekip Değerlendir
                </button>
            </div>

            {activeTab === 'goals' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="font-bold text-slate-800">Aktif Hedefler ({goals.length})</h2>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 shadow-md transition"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    {goals.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <h3 className="text-slate-900 font-bold mb-1">Henüz hedef eklenmemiş.</h3>
                            <p className="text-slate-500 text-sm">Bu dönem için kendinize yeni bir hedef belirleyin.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {goals.map((goal: any) => (
                            <div key={goal.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${goal.status === 'COMPLETED' ? 'bg-green-500' :
                                    goal.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'
                                    }`} />

                                <div className="pl-3 flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-lg ${goal.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                            {goal.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm mt-1">{goal.description}</p>

                                        {goal.dueDate && (
                                            <div className="flex items-center gap-1 mt-3 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded w-fit">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(goal.dueDate).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleProgress(goal.id, goal.status, goal.progress)}
                                        className={`rounded-full p-2 transition shrink-0 ${goal.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'
                                            }`}
                                    >
                                        {goal.status === 'COMPLETED' ? <CheckCircle className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 pl-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                        <span>İlerleme</span>
                                        <span>%{goal.progress}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${goal.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : activeTab === 'reviews' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* Performance Reviews */}
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-800 px-1 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                            Performans Değerlendirmeleri
                        </h2>
                        {reviews.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Henüz bir değerlendirme yapılmadı.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reviews.map((rev: any) => (
                                    <div key={rev.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {format(new Date(rev.createdAt), 'MMMM yyyy', { locale: tr })}
                                            </span>
                                            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-bold border border-indigo-100">
                                                Puan: {rev.score}/100
                                            </div>
                                        </div>
                                        <p className="text-slate-700 text-sm leading-relaxed">{rev.feedback}</p>
                                        {rev.aiInsight && (
                                            <div className="bg-indigo-900/5 p-3 rounded-xl border border-indigo-900/10">
                                                <div className="flex items-center gap-2 text-indigo-900 text-[10px] font-bold uppercase tracking-wider mb-1">
                                                    <Sparkles className="h-3 w-3" />
                                                    AI Önerisi
                                                </div>
                                                <p className="text-indigo-900/60 text-xs italic">
                                                    &quot;{rev.aiInsight}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Kudos Section */}
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-800 px-1 flex items-center gap-2">
                            <Award className="h-5 w-5 text-orange-600" />
                            Alınan Takdirler (Kudos)
                        </h2>
                        {kudos.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Henüz bir takdir almadınız. Başarılarınız yakında burada görünecek!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {kudos.map((k: any) => (
                                    <div key={k.id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex gap-4 items-center">
                                        <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                            <Award className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">
                                                <span className="font-bold text-slate-900">{k.author.name}</span> tarafından gönderildi
                                            </div>
                                            <p className="text-slate-800 font-medium text-sm mt-1">{k.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-white p-8 rounded-[30px] shadow-xl border border-slate-100">
                        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <MessageSquare className="h-6 w-6 text-indigo-600" />
                            Ekip Arkadaşını Değerlendir
                        </h2>

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Değerlendirilecek Kişi</label>
                                <select
                                    required
                                    value={reviewTarget}
                                    onChange={(e) => setReviewTarget(e.target.value)}
                                    className="w-full p-4 rounded-2xl border-slate-200 bg-slate-50 font-bold text-slate-700 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.department?.name || 'Genel'})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Puan (0-100)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={reviewScore}
                                        onChange={(e) => setReviewScore(Number(e.target.value))}
                                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="font-black text-indigo-600 text-xl w-12 text-center">{reviewScore}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geri Bildirim</label>
                                <textarea
                                    required
                                    value={reviewFeedback}
                                    onChange={(e) => setReviewFeedback(e.target.value)}
                                    placeholder="Güçlü yönleri ve gelişim alanları neler?"
                                    rows={4}
                                    className="w-full p-4 rounded-2xl border-slate-200 bg-slate-50 text-sm focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50"
                            >
                                {submittingReview ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Goal Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Hedef Belirle</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hedef Başlığı</label>
                                <input
                                    required
                                    className="w-full border-slate-200 rounded-xl p-3 text-sm focus:ring-indigo-500"
                                    placeholder="Örn: React Native öğren"
                                    value={newGoal.title}
                                    onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                                <textarea
                                    className="w-full border-slate-200 rounded-xl p-3 text-sm focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Detaylar..."
                                    value={newGoal.description}
                                    onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    className="w-full border-slate-200 rounded-xl p-3 text-sm focus:ring-indigo-500"
                                    value={newGoal.dueDate}
                                    onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 font-bold text-slate-500 rounded-xl">İptal</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 font-bold text-white rounded-xl">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

