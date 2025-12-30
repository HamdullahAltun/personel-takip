"use client";

import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffLMSPage() {
    const [trainings, setTrainings] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/lms').then(r => r.json()).then(data => {
            if (Array.isArray(data)) setTrainings(data);
        });
    }, []);

    const handleComplete = async (trainingId: string) => {
        // In real world, maybe open Video Modal first?
        // For now, simulate "Mark as Read" behavior
        await fetch('/api/lms', {
            method: 'POST',
            body: JSON.stringify({ action: 'COMPLETE', trainingId }),
            headers: { 'Content-Type': 'application/json' }
        });
        // Refresh
        const res = await fetch('/api/lms');
        setTrainings(await res.json());
    }

    const completedCount = trainings.filter(t => t.completions && t.completions.length > 0).length;
    const progress = trainings.length > 0 ? (completedCount / trainings.length) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">Eğitimlerim</h1>
                <p className="opacity-80 text-sm mb-4">Gelişimin için sana atanan eğitimleri tamamla.</p>

                <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="font-bold text-sm">%{Math.round(progress)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(training => {
                    const isCompleted = training.completions && training.completions.length > 0;
                    return (
                        <div key={training.id} className={cn(
                            "bg-white rounded-xl shadow-sm border overflow-hidden transition relative",
                            isCompleted ? "border-green-200 opacity-80" : "border-slate-200 hover:shadow-md"
                        )}>
                            <div className="aspect-video bg-slate-100 relative group">
                                {training.type === 'VIDEO' ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10">
                                        <PlayCircle className="h-12 w-12 text-indigo-600 opacity-80" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-blue-900/10">
                                        <BookOpen className="h-12 w-12 text-blue-600 opacity-80" />
                                    </div>
                                )}
                                {isCompleted && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
                                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-sm">
                                            <CheckCircle2 className="h-5 w-5" /> Tamamlandı
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-slate-900 line-clamp-1 mb-1">{training.title}</h3>
                                <p className="text-xs text-slate-500 line-clamp-2 h-8">{training.description}</p>

                                <div className="mt-4 pt-4 border-t flex justify-end">
                                    {isCompleted ? (
                                        <span className="text-xs font-bold text-green-600">Başarılı</span>
                                    ) : (
                                        <button onClick={() => handleComplete(training.id)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 w-full transition active:scale-95">
                                            Eğitimi Başlat
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
