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

export default function AIExecutiveSummary() {
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(true); // Initial fetch loading
    const [generating, setGenerating] = useState(false); // AI Generation loading
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/ai/executive-report');
            if (res.ok) {
                const data = await res.json();
                if (data.report) {
                    setReport(data.report);
                    setLastUpdated(data.createdAt);
                } else {
                    setReport(null); // Explicitly set to null if no report
                    setLastUpdated(null);
                }
            } else {
                setReport(null); // Handle cases where fetch is ok but no report (e.g., 204 No Content)
                setLastUpdated(null);
            }
        } catch (err) {
            console.error(err);
            setError("Rapor yüklenirken bir hata oluştu.");
            setReport(null);
            setLastUpdated(null);
        } finally {
            setLoading(false);
        }
    };

    const generateNewReport = async () => {
        try {
            setGenerating(true);
            setError(null);
            const res = await fetch('/api/ai/executive-report', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setReport(data.report);
                setLastUpdated(new Date().toISOString());
            } else {
                const errData = await res.json();
                if (res.status === 429) {
                    setError("AI kotası doldu. Lütfen biraz bekleyip tekrar deneyin.");
                } else {
                    setError("Rapor oluşturulurken bir hata oluştu.");
                }
            }
        } catch (err) {
            setError("Bağlantı hatası.");
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm font-medium">Rapor kontrol ediliyor...</p>
                </div>
            </div>
        );
    }

    if (!report && !generating) {
        return (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="bg-white/10 p-4 rounded-full mb-2">
                        <BrainCircuit className="h-8 w-8 text-indigo-300" />
                    </div>
                    <h2 className="text-2xl font-bold">Yapay Zeka Şirket Raporu</h2>
                    <p className="text-indigo-200 max-w-md text-sm">
                        Henüz bir rapor oluşturulmamış. Şirket verilerini analiz etmek ve yapay zeka destekli öneriler almak için aşağıdaki butonu kullanın.
                    </p>
                    <button
                        onClick={generateNewReport}
                        className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition active:scale-95 flex items-center gap-2 mt-2"
                    >
                        <BrainCircuit className="h-5 w-5" />
                        Analizi Başlat
                    </button>
                    {error && <p className="text-red-300 text-sm bg-red-900/50 px-3 py-1 rounded">{error}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 p-12 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 p-16 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

            <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                            <BrainCircuit className="h-6 w-6 text-indigo-300" />
                        </div>
                        <div>
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
