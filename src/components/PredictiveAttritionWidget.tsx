"use client";

import { useState } from "react";
import { BrainCircuit, ShieldAlert, Trophy, TrendingUp, Sparkles } from "lucide-react";

interface AnalysisResult {
    name: string;
    score?: number;      // For performance
    riskLevel?: number;  // For attrition
    reason: string;
    retentionPlan?: string;
    keyStrength?: string;
}

interface ApiResponse {
    results: AnalysisResult[];
}

export default function PredictiveAttritionWidget() {
    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'ATTRITION' | 'PERFORMANCE'>('ATTRITION');

    const runAnalysis = async (selectedMode: 'ATTRITION' | 'PERFORMANCE') => {
        setLoading(true);
        setMode(selectedMode);
        try {
            const res = await fetch(`/api/admin/predictive-analytics?type=${selectedMode}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">AI Öngörü Analizi</h3>
                </div>
                <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
                    <button
                        onClick={() => runAnalysis('ATTRITION')}
                        disabled={loading}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1 ${mode === 'ATTRITION' ? 'bg-rose-100 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <ShieldAlert className="w-3 h-3" /> Risk
                    </button>
                    <button
                        onClick={() => runAnalysis('PERFORMANCE')}
                        disabled={loading}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1 ${mode === 'PERFORMANCE' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Trophy className="w-3 h-3" /> Performans
                    </button>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="text-xs text-slate-500 font-medium italic">Veriler AI tarafından işleniyor...</span>
                    </div>
                ) : data ? (
                    <div className="space-y-3">
                        {data.results.map((item, i) => (
                            <div key={i} className={`p-3 rounded-xl border flex gap-3 group transition-colors ${mode === 'ATTRITION' ? 'border-rose-100 bg-rose-50/30 hover:bg-rose-50' : 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50'}`}>
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg shrink-0 ${mode === 'ATTRITION' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <span className="text-[9px] font-bold uppercase">{mode === 'ATTRITION' ? 'RİSK' : 'SKOR'}</span>
                                    <span className="text-sm font-black">
                                        {mode === 'ATTRITION' ? `%${item.riskLevel}` : item.score}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 text-sm truncate">{item.name}</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight mb-1">{item.reason}</p>

                                    {mode === 'ATTRITION' && item.retentionPlan && (
                                        <div className="flex items-start gap-1 p-1.5 rounded bg-white/60 border border-rose-100/50 text-[10px] text-rose-700 italic">
                                            <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                                            {item.retentionPlan}
                                        </div>
                                    )}

                                    {mode === 'PERFORMANCE' && item.keyStrength && (
                                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded w-fit">
                                            <TrendingUp className="w-3 h-3" />
                                            {item.keyStrength}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6 space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                            <BrainCircuit className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-xs text-slate-400 italic px-4">
                            Personel verilerinizi AI ile analiz etmek için yukarıdan bir mod seçin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
