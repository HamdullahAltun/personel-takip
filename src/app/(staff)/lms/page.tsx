"use client";

import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, BookOpen, Clock, Award, ChevronRight, X, BrainCircuit, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffLMSPage() {
    const [modules, setModules] = useState<any[]>([]);
    const [selectedModule, setSelectedModule] = useState<any | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<number | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        const res = await fetch('/api/lms');
        if (res.ok) {
            const data = await res.json();
            setModules(Array.isArray(data) ? data : []);
        }
    }

    const startModule = (module: any) => {
        setSelectedModule(module);
        setShowQuiz(false);
        setQuizResult(null);
        setQuizAnswers([]);
    }

    const startQuiz = () => {
        setQuizAnswers(new Array(selectedModule.quizData.length).fill(-1));
        setShowQuiz(true);
    }

    const submitQuiz = async () => {
        const correctCount = selectedModule.quizData.filter((q: any, i: number) => q.answer === quizAnswers[i]).length;
        const score = Math.round((correctCount / selectedModule.quizData.length) * 100);
        setQuizResult(score);

        if (score >= 60) { // Passing score 60%
            await fetch('/api/lms', {
                method: 'POST',
                body: JSON.stringify({ action: 'COMPLETE', moduleId: selectedModule.id, score }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetchModules();
        }
    }

    const completedCount = modules.filter(m => m.completions && m.completions.length > 0).length;
    const totalPoints = modules
        .filter(m => m.completions && m.completions.length > 0)
        .reduce((acc, m) => acc + (m.points || 0), 0);
    const progress = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight">Eğitim & Gelişim</h1>
                        <p className="text-indigo-100 text-sm leading-relaxed max-w-sm">
                            Kariyerini parlat! Atanan eğitimleri tamamla, testleri geç ve ödül puanlarını topla.
                        </p>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black">{completedCount}/{modules.length}</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-200">Tamamlanan</span>
                            </div>
                            <div className="w-px h-10 bg-white/20"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-amber-400 flex items-center gap-1">
                                    <Star className="h-5 w-5 fill-current" /> {totalPoints}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-200">Kazanılan Puan</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Genel İlerleme</span>
                            <span className="text-xl font-black">%{Math.round(progress)}</span>
                        </div>
                        <div className="h-4 bg-black/20 rounded-full overflow-hidden p-1">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(module => {
                    const isCompleted = module.completions && module.completions.length > 0;
                    return (
                        <div key={module.id} className={cn(
                            "bg-white rounded-3xl shadow-sm border overflow-hidden transition-all duration-300 relative group",
                            isCompleted ? "border-green-100 opacity-90" : "border-slate-100 hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1"
                        )}>
                            <div className="aspect-video bg-slate-50 relative overflow-hidden">
                                {module.type === 'VIDEO' ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/5 group-hover:bg-indigo-900/10 transition">
                                        <PlayCircle className="h-14 w-14 text-indigo-600/80 group-hover:scale-110 transition-transform" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-blue-900/5">
                                        <BookOpen className="h-14 w-14 text-blue-600/80" />
                                    </div>
                                )}

                                {isCompleted && (
                                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-2xl font-black text-xs text-emerald-600 shadow-xl border border-emerald-100 flex items-center gap-2 animate-in zoom-in-95">
                                            <CheckCircle2 className="h-4 w-4" /> TAMAMLANDI
                                        </div>
                                    </div>
                                )}

                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-slate-500 shadow-sm border border-slate-100">
                                        {module.category}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 line-clamp-1 flex-1">{module.title}</h3>
                                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                        +{module.points} Puan
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed mb-6">{module.description}</p>

                                <button
                                    onClick={() => startModule(module)}
                                    className={cn(
                                        "w-full py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2",
                                        isCompleted
                                            ? "bg-slate-50 text-slate-400 border border-slate-100"
                                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100"
                                    )}
                                >
                                    {isCompleted ? 'Tekrar İncele' : 'Eğitime Başla'}
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content View Modal */}
            {selectedModule && !showQuiz && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-indigo-600 uppercase">
                                    <Award className="h-4 w-4" />
                                    {selectedModule.category} • {selectedModule.points} Puan Değerinde
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">{selectedModule.title}</h2>
                            </div>
                            <button onClick={() => setSelectedModule(null)} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                            <div className="aspect-video bg-slate-900 rounded-[30px] mb-8 relative group overflow-hidden shadow-2xl">
                                {selectedModule.type === 'VIDEO' ? (
                                    <iframe
                                        src={selectedModule.contentUrl.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-blue-600 to-indigo-900 p-12 text-center">
                                        <BookOpen className="h-20 w-20 mb-6 opacity-40" />
                                        <p className="text-lg font-medium max-w-md">Lütfen harici dokümanı inceleyin ve ardından testi başlatın.</p>
                                        <a href={selectedModule.contentUrl} target="_blank" className="mt-8 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform">Dokümanı Görüntüle</a>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-slate max-w-none">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Eğitim Hakkında</h3>
                                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">{selectedModule.description}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> Yaklaşık 10 Dakika</div>
                                <div className="flex items-center gap-1"><BrainCircuit className="h-4 w-4" /> 3 Soru</div>
                            </div>

                            {selectedModule.quizData ? (
                                <button
                                    onClick={startQuiz}
                                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    <BrainCircuit className="h-5 w-5" /> Testi Başlat ve Puan Kazan
                                </button>
                            ) : (
                                <div className="text-xs font-bold text-slate-400 italic">Bu modülde test bulunmuyor.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz View Modal */}
            {selectedModule && showQuiz && (
                <div className="fixed inset-0 bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl relative overflow-hidden">

                        {quizResult === null ? (
                            <>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                        <BrainCircuit className="h-6 w-6" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900">Eğitim Testi</h2>
                                </div>

                                <div className="space-y-8">
                                    {selectedModule.quizData.map((q: any, i: number) => (
                                        <div key={i} className="space-y-4">
                                            <p className="font-bold text-slate-800 text-lg leading-snug">
                                                <span className="text-indigo-600 mr-2">{i + 1}.</span> {q.question}
                                            </p>
                                            <div className="grid gap-3">
                                                {q.options.map((opt: string, oi: number) => (
                                                    <button
                                                        key={oi}
                                                        onClick={() => {
                                                            const newA = [...quizAnswers];
                                                            newA[i] = oi;
                                                            setQuizAnswers(newA);
                                                        }}
                                                        className={cn(
                                                            "text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm",
                                                            quizAnswers[i] === oi
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                                                                : "bg-slate-50 border-slate-50 text-slate-600 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex gap-4">
                                    <button onClick={() => setShowQuiz(false)} className="flex-1 py-4 text-slate-400 font-black hover:bg-slate-50 rounded-2xl">Vazgeç</button>
                                    <button
                                        disabled={quizAnswers.includes(-1)}
                                        onClick={submitQuiz}
                                        className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:opacity-30 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                                    >
                                        Testi Bitir
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10 space-y-6">
                                <div className={cn(
                                    "w-32 h-32 rounded-full mx-auto flex items-center justify-center animate-bounce shadow-2xl",
                                    quizResult >= 60 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}>
                                    {quizResult >= 60 ? <CheckCircle2 className="h-16 w-16" /> : <X className="h-16 w-16" />}
                                </div>

                                <h2 className="text-4xl font-black text-slate-900">%{quizResult} Skoru</h2>
                                <p className="text-slate-500 font-medium px-10">
                                    {quizResult >= 60
                                        ? "Harika! Testi başarıyla geçtin ve ödül puanlarını kazandın. Gelişime devam et!"
                                        : "Maalesef yeterli skoru alamadın. Eğitim içeriğini tekrar inceleyip yeniden deneyebilirsin."}
                                </p>

                                <div className="pt-6">
                                    <button
                                        onClick={() => {
                                            setSelectedModule(null);
                                            setShowQuiz(false);
                                            setQuizResult(null);
                                        }}
                                        className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
