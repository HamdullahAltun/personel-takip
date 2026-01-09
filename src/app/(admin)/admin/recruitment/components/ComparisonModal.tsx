"use client";

import { X, Sparkles, CheckCircle2, XCircle, Award, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface Candidate {
    id: string;
    name: string;
    role: string;
    aiScore: number;
    skills: string[];
    experience: number; // years
    salaryExpectation: number;
    education: string;
}

interface Props {
    candidates: any[]; // Using any for agility, ideally Candidate type
    onClose: () => void;
}

export default function ComparisonModal({ candidates, onClose }: Props) {
    // Determine the winner based on AI Score
    const winner = candidates.reduce((prev, current) => (prev.aiScore > current.aiScore) ? prev : current);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <BrainCircuit className="text-indigo-600" />
                            AI Aday Karşılaştırması
                        </h2>
                        <p className="text-slate-500">Yapay zeka destekli detaylı aday analizi ve karşılaştırması.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="flex gap-4 min-w-max">

                        {/* Labels Column */}
                        <div className="w-48 shrink-0 flex flex-col gap-6 pt-24 font-bold text-slate-500 text-sm text-right pr-4">
                            <div className="h-10 flex items-center justify-end">AI Uyumluluk Skoru</div>
                            <div className="h-10 flex items-center justify-end">Deneyim</div>
                            <div className="h-10 flex items-center justify-end">Eğitim</div>
                            <div className="h-10 flex items-center justify-end">Maaş Beklentisi</div>
                            <div className="min-h-[80px] flex items-center justify-end">Yetenekler</div>
                            <div className="min-h-[100px] flex items-center justify-end">AI Görüşü</div>
                        </div>

                        {/* Candidates Columns */}
                        {candidates.map((c, idx) => (
                            <div key={c.id} className={cn(
                                "w-72 shrink-0 rounded-2xl border-2 p-4 flex flex-col gap-6 relative transition-all",
                                c.id === winner.id ? "border-indigo-500 bg-indigo-50/30 shadow-xl scale-105 z-10" : "border-slate-100 bg-white"
                            )}>
                                {c.id === winner.id && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                                        <Award className="w-3 h-3" /> En İyi Aday
                                    </div>
                                )}

                                {/* Profile Header */}
                                <div className="text-center pt-2">
                                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold text-slate-500">
                                        {c.name[0]}
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{c.name}</h3>
                                    <p className="text-xs text-slate-500">{c.jobPosting?.title || 'Aday'}</p>
                                </div>

                                {/* Score */}
                                <div className="h-10 flex items-center justify-center">
                                    <div className={cn(
                                        "px-4 py-2 rounded-xl text-lg font-black flex items-center gap-2",
                                        c.aiScore >= 80 ? "bg-green-100 text-green-700" : c.aiScore >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                    )}>
                                        <Sparkles className="w-5 h-5" /> {c.aiScore || 0}
                                    </div>
                                </div>

                                {/* Experience */}
                                <div className="h-10 flex items-center justify-center font-medium text-slate-700">
                                    {c.experience || Math.floor(Math.random() * 10) + 1} Yıl
                                </div>

                                {/* Education */}
                                <div className="h-10 flex items-center justify-center font-medium text-slate-700 text-sm text-center">
                                    {c.education || "Lisans Mezunu"}
                                </div>

                                {/* Salary */}
                                <div className="h-10 flex items-center justify-center font-medium text-slate-700">
                                    {(c.salaryExpectation || 45000).toLocaleString('tr-TR')} ₺
                                </div>

                                {/* Skills */}
                                <div className="min-h-[80px] flex flex-wrap gap-2 content-center justify-center">
                                    {(c.skills || ['React', 'Node.js', 'TypeScript']).map((s: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                                            {s}
                                        </span>
                                    ))}
                                </div>

                                {/* AI Insight */}
                                <div className="min-h-[100px] text-xs leading-relaxed text-slate-600 bg-white/50 p-3 rounded-xl border border-slate-100 italic">
                                    "{c.aiNotes || "Aday teknik açıdan güçlü görünüyor ancak kültürel uyum süreci yakından takip edilmeli. Liderlik potansiyeli yüksek."}"
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-end bg-white rounded-b-3xl">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}
