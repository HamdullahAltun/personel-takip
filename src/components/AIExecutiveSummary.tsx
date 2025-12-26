"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type AnalysisReport = {
    summary: string;
    score: number;
    details: any;
    recommendations: string[];
    risks: string[];
}

export default function AIExecutiveSummary() {
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
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
                    setReport(null);
                }
            } else {
                setReport(null);
            }
        } catch (err) {
            console.error(err);
            setError("Rapor yüklenirken bir hata oluştu.");
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
                    setError("AI kotası doldu. Lütfen 1-2 dakika bekleyip tekrar deneyin.");
                } else {
                    setError("Rapor oluşturulamadı.");
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
                        Henüz bir rapor oluşturulmamış. Şirket verilerini analiz etmek ve öneriler almak için aşağıdaki butonu kullanın.
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
                            <h2 className="font-bold text-lg">Yapay Zeka Analizi</h2>
                            <p className="text-indigo-200 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lastUpdated && !generating ? format(new Date(lastUpdated), "d MMMM HH:mm", { locale: tr }) : 'İşleniyor...'}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {report && !generating && (
                            <div className="bg-white/10 px-3 py-1 rounded-full text-indigo-200 text-xs font-mono font-bold backdrop-blur-sm border border-white/5">
                                SKOR: <span className="text-white text-sm ml-1">{report.score}</span>/100
                            </div>
                        )}
                        <button
                            onClick={generateNewReport}
                            disabled={generating}
                            className={`flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
                            {generating ? 'Analiz Ediliyor...' : 'Yenile'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-xl text-xs text-red-200 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {!generating && report && (
                    <>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-indigo-100 text-sm leading-relaxed">
                                {report.summary}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                                <h3 className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Lightbulb className="h-3.5 w-3.5" />
                                    Öneri
                                </h3>
                                <p className="text-emerald-100 text-xs font-medium line-clamp-2">
                                    {report.recommendations?.[0] || "Öneri bulunamadı."}
                                </p>
                            </div>

                            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                                <h3 className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Risk
                                </h3>
                                <p className="text-rose-100 text-xs font-medium line-clamp-2">
                                    {report.risks?.[0] || "Risk bulunamadı."}
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/executive/dashboard"
                            className="block w-full text-center bg-white text-indigo-950 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition active:scale-[0.98]"
                        >
                            Detaylı Raporu İncele
                        </Link>
                    </>
                )}

                {generating && (
                    <div className="py-12 space-y-4 flex flex-col items-center">
                        <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 animate-progress w-1/2 mx-auto rounded-full"></div>
                        </div>
                        <p className="text-center text-xs text-indigo-300 animate-pulse">
                            Veriler analiz ediliyor, lütfen bekleyin...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
