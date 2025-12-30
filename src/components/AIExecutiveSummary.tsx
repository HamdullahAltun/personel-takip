

"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, Clock, X, ChevronRight } from "lucide-react";
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
    const [isOpen, setIsOpen] = useState(false);

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
        const interval = setInterval(fetchReport, 60000); // Check every minute if there's a new report elsewhere
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse h-16 w-full"></div>
        );
    }

    return (
        <>
            {/* Trigger Button - Compact Dashboard Widget */}
            <div onClick={() => setIsOpen(true)} className="bg-gradient-to-r from-indigo-900 to-violet-900 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl hover:scale-[1.01] transition relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/20 transition"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <BrainCircuit className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Yapay Zeka Analizi</h3>
                            <p className="text-indigo-200 text-sm">
                                {report ? "Güncel rapor hazır" : "Analiz henüz yapılmadı"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {report && (
                            <div className="text-right hidden sm:block">
                                <span className="block text-xs text-indigo-300 font-bold uppercase tracking-wider">SKOR</span>
                                <span className="text-2xl font-bold">{report.score}</span>
                            </div>
                        )}
                        <ChevronRight className="h-6 w-6 text-indigo-300" />
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">

                        {/* Modal Header */}
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                            <div className="flex items-center gap-2 text-slate-900">
                                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                                <h2 className="font-bold">Yapay Zeka Şirket Raporu</h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Actions / Status */}
                            <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Son güncelleme: {lastUpdated ? format(new Date(lastUpdated), "d MMMM HH:mm", { locale: tr }) : 'Yok'}
                                </div>
                                <button
                                    onClick={generateNewReport}
                                    disabled={generating}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm active:scale-95"
                                >
                                    <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                                    {generating ? 'Analiz Ediliyor...' : 'Yeniden Analiz Et'}
                                </button>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex gap-2 items-center text-sm font-bold">
                                    <AlertTriangle className="h-5 w-5" />
                                    {error}
                                </div>
                            )}

                            {/* Report Body */}
                            {!generating && report ? (
                                <div className="space-y-6 animate-in slide-in-from-bottom-5">
                                    {/* Score Card */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative h-24 w-24 flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <path className={`${report.score > 70 ? 'text-green-500' : report.score > 50 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`} strokeDasharray={`${report.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                            </svg>
                                            <span className="text-2xl font-bold text-slate-800">{report.score}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 text-lg mb-1">Genel Performans Skoru</h3>
                                            <p className="text-sm text-slate-500">Bu skor; katılım, verimlilik ve gider dengesi baz alınarak hesaplanmıştır.</p>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="prose prose-sm text-slate-600">
                                        <p className="whitespace-pre-wrap leading-relaxed">{report.summary}</p>
                                    </div>

                                    {/* Recommendations & Risks Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <h4 className="flex items-center gap-2 text-green-700 font-bold mb-3">
                                                <Lightbulb className="h-5 w-5" /> Öneriler
                                            </h4>
                                            <ul className="space-y-2">
                                                {report.recommendations.map((rec, i) => (
                                                    <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                        {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <h4 className="flex items-center gap-2 text-red-700 font-bold mb-3">
                                                <AlertTriangle className="h-5 w-5" /> Riskler
                                            </h4>
                                            <ul className="space-y-2">
                                                {report.risks.map((risk, i) => (
                                                    <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                                        {risk}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : generating ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center animate-pulse">
                                        <BrainCircuit className="h-8 w-8 text-indigo-500 animate-spin" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">Analiz Yapılıyor</h3>
                                        <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Yapay zeka şu anda şirket verilerini işleyerek rapor hazırlıyor. Bu işlem 10-20 saniye sürebilir.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400">
                                    <BrainCircuit className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p>Henüz rapor oluşturulmadı. Başlamak için butona tıklayın.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
