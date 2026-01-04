"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { TrendingUp, CheckCircle, Circle, ArrowRight, Target, Plus, Calendar } from "lucide-react";

export default function StaffGoalsPage() {
    const { data: goals = [], mutate } = useSWR('/api/goals', (url) => fetch(url).then(r => r.json()));
    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: "", description: "", dueDate: "" });

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

    return (
        <div className="max-w-2xl mx-auto pb-24 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hedeflerim (OKRs)</h1>
                    <p className="text-slate-500 text-sm">Performans döneminiz için belirlenen hedefler.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 shadow-md transition"
                >
                    <Plus className="h-6 w-6" />
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
                            <div>
                                <h3 className={`font-bold text-lg ${goal.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                    {goal.title}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">{goal.description}</p>

                                {goal.dueDate && (
                                    <div className="flex items-center gap-1 mt-3 text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded w-fit">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(goal.dueDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleProgress(goal.id, goal.status, goal.progress)}
                                className={`rounded-full p-2 transition ${goal.status === 'COMPLETED' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'
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

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
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
