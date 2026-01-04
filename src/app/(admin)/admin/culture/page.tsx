"use client";

import { useState, useEffect } from "react";
import { Heart, Activity, AlertTriangle, Lightbulb, MessageSquare, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CultureDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/culture/analyze');
            const result = await res.json();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="h-12 w-12 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-sm">Şirket Kültürü Analiz Ediliyor...</p>
            </div>
        );
    }

    const score = data?.sentimentScore || 0;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kültür & Moral Radarı</h1>
                    <p className="text-slate-500 font-medium">AI tabanlı anonim iletişim analizi ve risk tespiti</p>
                </div>
                <button
                    onClick={fetchAnalysis}
                    className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm active:scale-95"
                >
                    <RefreshCw className="h-5 w-5 text-slate-600" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Score Gauge */}
                <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000",
                                score > 70 ? "bg-emerald-500" : score > 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${score}%` }}
                        />
                    </div>

                    <div className="mb-6 relative">
                        <div className={cn(
                            "w-48 h-48 rounded-full border-[12px] flex flex-col items-center justify-center transition-colors duration-500",
                            score > 70 ? "border-emerald-50 text-emerald-600" : score > 40 ? "border-amber-50 text-amber-600" : "border-rose-50 text-rose-600"
                        )}>
                            <span className="text-6xl font-black tracking-tighter">{score}</span>
                            <span className="text-xs font-bold uppercase opacity-50">Moral Skoru</span>
                        </div>
                        {score > 70 ? (
                            <TrendingUp className="absolute -top-2 -right-2 h-10 w-10 text-emerald-500 bg-white rounded-full p-2 border border-emerald-100 italic" />
                        ) : (
                            <TrendingDown className="absolute -top-2 -right-2 h-10 w-10 text-rose-500 bg-white rounded-full p-2 border border-rose-100" />
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 mb-2">{data?.moodLabel}</h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed px-4">{data?.summary}</p>
                </div>

                {/* Analysis & Keywords */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
                                <Activity className="h-4 w-4 text-indigo-500" /> Öne Çıkan Kavramlar
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {data?.topKeywords?.map((kw: string, i: number) => (
                                    <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black border border-indigo-100">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-rose-500 p-6 rounded-[32px] text-white shadow-xl shadow-rose-100">
                            <h3 className="flex items-center gap-2 text-xs font-black uppercase text-rose-100 tracking-wider mb-4">
                                <AlertTriangle className="h-4 w-4" /> Kritik AI Alarmları
                            </h3>
                            <ul className="space-y-3">
                                {data?.criticalAlerts?.map((alert: string, i: number) => (
                                    <li key={i} className="text-xs font-bold flex items-start gap-2 bg-white/10 p-2 rounded-xl">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                        {alert}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative group">
                        <Lightbulb className="absolute -right-10 -top-10 h-40 w-40 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
                        <h3 className="flex items-center gap-2 text-sm font-black uppercase text-indigo-400 tracking-widest mb-6">
                            AI Strateji Önerisi
                        </h3>
                        <p className="text-lg font-bold text-slate-200 leading-relaxed italic relative z-10">
                            "{data?.recommendation}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Culture Pulse Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: Heart, label: "Bağlılık", val: score > 60 ? "Yüksek" : "Orta", color: "text-rose-500", bg: "bg-rose-50" },
                    { icon: Activity, label: "Enerji", val: score > 50 ? "Dinamik" : "Sakin", color: "text-blue-500", bg: "bg-blue-50" },
                    { icon: MessageSquare, label: "İletişim", val: (data?.topKeywords?.length || 0) > 3 ? "Açık" : "Kısıtlı", color: "text-amber-500", bg: "bg-amber-50" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className={cn("p-4 rounded-2xl", stat.bg, stat.color)}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">{stat.label}</p>
                            <p className="text-xl font-black text-slate-800 tracking-tight">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-indigo-600 rounded-[40px] p-10 text-white relative flex flex-col items-center text-center overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Kültür Verisi Nasıl Toplanıyor?</h2>
                    <p className="text-indigo-100 font-medium max-w-2xl text-sm leading-relaxed">
                        Analiz tamamen anonimdir. AI, mesaj yazarlarının kimliğine bakmadan sadece kullanılan dil, tonlama ve anahtar kelimeler üzerinden şirket moralini ölçer. Kişisel veriler işlenmez.
                    </p>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
            </div>
        </div>
    );
}
