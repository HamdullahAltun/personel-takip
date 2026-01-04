"use client";

import { useState } from "react";
import { BrainCircuit, ShieldAlert } from "lucide-react";

interface AttritionRisk {
    name: string;
    riskLevel: number;
    reason: string;
}

interface AttritionAnalysis {
    topRisks: AttritionRisk[];
}

export default function PredictiveAttritionWidget() {
    const [analysis, setAnalysis] = useState<AttritionAnalysis | null>(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/predictive-analytics");
            if (res.ok) setAnalysis(await res.json());
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
                    <h3 className="font-bold text-slate-800 text-sm">AI Risk Analizi (Ayrılma Tahmini)</h3>
                </div>
                {!analysis && !loading && (
                    <button
                        onClick={runAnalysis}
                        className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition"
                    >
                        ANALİZ ET
                    </button>
                )}
            </div>
            <div className="p-4 flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        <span className="text-xs text-slate-500 font-medium italic">Personel verileri AI tarafından işleniyor...</span>
                    </div>
                ) : analysis ? (
                    <div className="space-y-4">
                        {analysis.topRisks.map((risk: AttritionRisk, i: number) => (
                            <div key={i} className="flex gap-3 p-3 rounded-xl border border-rose-100 bg-rose-50/30 group hover:bg-rose-50 transition-colors">
                                <div className="flex flex-col items-center justify-center bg-rose-100 text-rose-600 w-10 h-10 rounded-lg shrink-0">
                                    <span className="text-[10px] font-bold">RISK</span>
                                    <span className="text-sm font-black">%{risk.riskLevel}</span>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-700">{risk.name}</h4>
                                    <p className="text-[11px] text-slate-500 leading-tight">{risk.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
                        <ShieldAlert className="w-12 h-12 text-slate-200" />
                        <p className="text-xs text-slate-400 italic">Verileri analiz ederek işten ayrılma riski olan personelleri keşfedin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
