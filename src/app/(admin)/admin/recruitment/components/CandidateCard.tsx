"use client";

import { useState } from "react";
import { Sparkles, Phone, Mail, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    aiScore?: number;
    aiNotes?: string;
    jobPosting?: { title: string };
    resumeUrl?: string;
}

interface Props {
    candidate: Candidate;
    onRefresh: () => void;
}

export default function CandidateCard({ candidate, onRefresh }: Props) {
    const [analyzing, setAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            await fetch('/api/admin/recruitment/analyze', {
                method: 'POST',
                body: JSON.stringify({ candidateId: candidate.id }),
                headers: { 'Content-Type': 'application/json' }
            });
            onRefresh();
        } catch (error) {
            alert("Analiz başarısız oldu.");
        }
        setAnalyzing(false);
    };

    const getScoreColor = (score?: number) => {
        if (!score) return "bg-gray-100 text-gray-500";
        if (score >= 80) return "bg-green-100 text-green-700";
        if (score >= 60) return "bg-amber-100 text-amber-700";
        return "bg-red-100 text-red-700";
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="font-bold text-slate-900">{candidate.name}</h3>
                    <p className="text-xs text-slate-500">{candidate.jobPosting?.title || 'Pozisyon Yok'}</p>
                </div>
                {candidate.aiScore ? (
                    <div className={cn("px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1", getScoreColor(candidate.aiScore))}>
                        <Sparkles className="h-3 w-3" /> {candidate.aiScore}
                    </div>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
                        disabled={analyzing}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                        title="AI ile Analiz Et"
                    >
                        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </button>
                )}
            </div>

            <div className="space-y-1 text-xs text-slate-600 mb-3">
                <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{candidate.phone}</span>
                </div>
            </div>

            {candidate.aiNotes && (
                <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-600 leading-snug line-clamp-2 mb-2 border border-slate-100">
                    <span className="font-bold text-indigo-600 block mb-0.5">AI Özeti:</span>
                    {candidate.aiNotes}
                </div>
            )}

            <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50">
                <a href={`tel:${candidate.phone}`} className="flex-1 py-1.5 text-center bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600 transition">
                    Ara
                </a>
                {candidate.resumeUrl && (
                    <a href={candidate.resumeUrl} target="_blank" className="flex-1 py-1.5 text-center bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium text-blue-600 transition">
                        CV
                    </a>
                )}
            </div>
        </div>
    );
}
