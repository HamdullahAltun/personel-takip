"use client";

import { useEffect, useState } from "react";
import { Loader2, BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, MessageSquare, Clock, Wallet } from "lucide-react";

interface AnalysisReport {
    summary: string;
    score: number;
    details: {
        attendance: string;
        tasks: string;
        expenses: string;
        communication: string;
    };
    recommendations: string[];
    risks: string[];
}

export default function DetailedExecutiveReport() {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);

    useEffect(() => {
        fetch('/api/ai/executive-report')
            .then(res => res.json())
            .then(data => {
                setAnalysis(data.report);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <BrainCircuit className="h-16 w-16 text-amber-600 animate-pulse relative z-10" />
                </div>
                <h2 className="text-xl font-medium text-slate-600">Yapay Zeka Şirket Verilerini Analiz Ediyor...</h2>
                <p className="text-slate-400 text-sm">Mesajlar, görevler, harcamalar ve devamlılık taranıyor.</p>
            </div>
        );
    }

    if (!analysis) return (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-red-500">
            Analiz oluşturulamadı veya yetki sorunu.
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <BrainCircuit className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">AI Şirket Raporu</h2>
                    <p className="text-sm text-slate-500">Tüm veriler analiz edilerek oluşturulan yönetici özeti</p>
                </div>
            </div>

            {/* Top Score Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3 text-amber-400 font-bold tracking-wider text-sm uppercase">
                            <BrainCircuit className="h-5 w-5" />
                            AI Genel Değerlendirme
                        </div>
                        <h2 className="text-2xl md:text-3xl font-light leading-relaxed">
                            "{analysis.summary}"
                        </h2>
                    </div>

                    <div className="flex flex-col items-center justify-center min-w-[200px]">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="45" fill="none" stroke="#f59e0b" strokeWidth="8"
                                    strokeDasharray={`${(analysis.score / 100) * 283} 283`}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <span className="text-4xl font-bold">{analysis.score}</span>
                        </div>
                        <p className="mt-2 text-slate-400 text-sm font-medium">Şirket Sağlık Puanı</p>
                    </div>
                </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalysisCard
                    title="Devamlılık & Disiplin"
                    content={analysis.details.attendance}
                    icon={Clock}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <AnalysisCard
                    title="Görev Performansı"
                    content={analysis.details.tasks}
                    icon={CheckCircle2}
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <AnalysisCard
                    title="Harcama Analizi"
                    content={analysis.details.expenses}
                    icon={Wallet}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <AnalysisCard
                    title="İletişim & Kültür"
                    content={analysis.details.communication}
                    icon={MessageSquare}
                    color="text-pink-600"
                    bg="bg-pink-50"
                />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recommendations */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">Stratejik Tavsiyeler</h3>
                    </div>
                    <ul className="space-y-4">
                        {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-4 items-start p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                <p className="text-slate-700 leading-relaxed">{rec}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risks */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">Tespit Edilen Riskler</h3>
                    </div>
                    <ul className="space-y-4">
                        {analysis.risks.map((risk, i) => (
                            <li key={i} className="flex gap-4 items-start p-3 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors border border-red-100/50">
                                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-slate-700 leading-relaxed">{risk}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function AnalysisCard({ title, content, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
                {content}
            </p>
        </div>
    );
}
