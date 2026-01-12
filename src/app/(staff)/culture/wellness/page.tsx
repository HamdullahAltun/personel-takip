"use client";

import { useState, useEffect } from "react";
import { Activity, Droplets, Moon, Footprints, Trophy, Plus, Check } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import TeamMood from "@/components/staff/TeamMood";

const ACTIVITY_TYPES = [
    { id: 'STEPS', label: 'Adım', icon: Footprints, color: 'text-orange-500', bg: 'bg-orange-100', unit: 'adım' },
    { id: 'WATER', label: 'Su', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-100', unit: 'lt' },
    { id: 'SLEEP', label: 'Uyku', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-100', unit: 'saat' },
];

export default function WellnessPage() {
    const [data, setData] = useState<{ activities: any[], challenges: any[] }>({ activities: [], challenges: [] });
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newActivity, setNewActivity] = useState({ type: 'STEPS', value: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/staff/wellness');
            if (res.ok) setData(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newActivity.value) return;
        const typeConfig = ACTIVITY_TYPES.find(t => t.id === newActivity.type);

        try {
            await fetch('/api/staff/wellness', {
                method: 'POST',
                body: JSON.stringify({ ...newActivity, unit: typeConfig?.unit }),
                headers: { 'Content-Type': 'application/json' }
            });
            setShowAdd(false);
            setNewActivity({ type: 'STEPS', value: '' });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-24 space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl text-white shadow-lg">
                    <Activity className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sağlık & Yaşam</h1>
                    <p className="text-slate-500 text-xs">Kendine iyi bak, daha iyi çalış.</p>
                </div>
            </div>

            {/* Mood Tracker */}
            <div className="mb-6 h-64">
                <TeamMood />
            </div>

            {/* Quick Add */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700">Günlük Aktivite Ekle</h3>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        className={`p-2 rounded-full transition-all ${showAdd ? 'bg-slate-100 rotate-45' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                </div>

                {showAdd && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {ACTIVITY_TYPES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setNewActivity({ ...newActivity, type: t.id })}
                                    className={`flex flex-col items-center p-3 rounded-xl border min-w-[80px] transition-all
                                        ${newActivity.type === t.id
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                                            : 'border-slate-100 hover:bg-slate-50 text-slate-500'}
                                    `}
                                >
                                    <t.icon className={`h-6 w-6 mb-2 ${t.color}`} />
                                    <span className="text-xs">{t.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Değer girin..."
                                value={newActivity.value}
                                onChange={(e) => setNewActivity({ ...newActivity, value: e.target.value })}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                onClick={handleAdd}
                                className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            >
                                <Check className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Weekly Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <h4 className="text-emerald-800 font-bold text-sm mb-1">Bu Hafta</h4>
                    <div className="text-2xl font-black text-emerald-600">
                        {data.activities.reduce((acc, curr) => curr.type === 'STEPS' ? acc + curr.value : acc, 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-emerald-600/70">Toplam Adım</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <h4 className="text-blue-800 font-bold text-sm mb-1">Su Tüketimi</h4>
                    <div className="text-2xl font-black text-blue-600">
                        {data.activities.reduce((acc, curr) => curr.type === 'WATER' ? acc + curr.value : acc, 0).toFixed(1)} <span className="text-sm">lt</span>
                    </div>
                    <p className="text-xs text-blue-600/70">Haftalık Toplam</p>
                </div>
            </div>

            {/* Challenges */}
            <h3 className="font-bold text-slate-800 px-1">Aktif Meydan Okumalar</h3>
            <div className="space-y-3">
                {data.challenges.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                        Aktif yarışma yok.
                    </div>
                ) : data.challenges.map((c: any) => (
                    <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{c.title}</h4>
                            <p className="text-xs text-slate-500">{c.description}</p>
                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-yellow-500 h-full w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* History List */}
            <h3 className="font-bold text-slate-800 px-1 pt-4">Son Aktiviteler</h3>
            <div className="space-y-2">
                {data.activities.map((act: any) => {
                    const type = ACTIVITY_TYPES.find(t => t.id === act.type);
                    const Icon = type?.icon || Activity;
                    return (
                        <div key={act.id} className="flex items-center justify-between p-3 bg-white border border-slate-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${type?.bg || 'bg-gray-100'}`}>
                                    <Icon className={`h-4 w-4 ${type?.color || 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">{type?.label || act.type}</p>
                                    <p className="text-[10px] text-slate-400">
                                        {format(new Date(act.date), 'd MMMM HH:mm', { locale: tr })}
                                    </p>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-slate-600">
                                {act.value} <span className="text-xs font-normal text-slate-400">{act.unit}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
