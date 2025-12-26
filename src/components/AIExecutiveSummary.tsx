"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, TrendingUp, AlertTriangle, CheckCircle2, MessageSquare, Clock, Wallet } from "lucide-react";

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

export default function AIExecutiveSummary({ role }: { role: string }) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);

    // Only fetch if EXECUTIVE
    useEffect(() => {
        if (role !== 'EXECUTIVE') return;

        fetch('/api/ai/executive-report')
            .then(res => res.json())
            .then(data => {
                if (data.report) setAnalysis(data.report);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [role]);

    if (role !== 'EXECUTIVE') return null;

    if (loading) {
        return (
            <div className="bg-slate-900 rounded-2xl p-6 text-white text-center space-y-4 shadow-xl border border-amber-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/10 animate-pulse"></div>
                <BrainCircuit className="h-12 w-12 text-amber-500 mx-auto animate-pulse relative z-10" />
                <p className="font-medium relative z-10">Yapay Zeka Şirket Analizini Hazırlıyor...</p>
            </div>
        );
    }

    if (!analysis) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-700">
            {/* Executive Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-amber-500/20">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-amber-400 font-bold tracking-wider text-xs uppercase mb-4">
                        <BrainCircuit className="h-4 w-4" />
                        Üst Yönetici Özeti
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-light italic leading-relaxed text-slate-100">
                                "{analysis.summary}"
                            </h2>
                        </div>
                        <div className="flex-shrink-0 bg-slate-800/50 p-4 rounded-xl border border-amber-500/20 text-center min-w-[120px]">
                            <span className="block text-4xl font-bold text-amber-400">{analysis.score}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">Sağlık Puanı</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl text-sm border-l-4 border-emerald-500 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 font-bold text-emerald-700">
                        <TrendingUp className="h-4 w-4" />
                        Stratejik Tavsiye
                    </div>
                    <p>{analysis.recommendations[0]}</p>
                </div>
                <div className="bg-white p-5 rounded-xl text-sm border-l-4 border-red-500 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 font-bold text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Dikkat Gerektiren Risk
                    </div>
                    <p>{analysis.risks[0]}</p>
                </div>
            </div>
        </div>
    );
}
