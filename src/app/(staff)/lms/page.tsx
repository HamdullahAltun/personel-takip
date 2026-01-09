"use client";

import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, BookOpen, Clock, Award, ChevronRight, X, BrainCircuit, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StaffLMSPage() {
    interface QuizQuestion {
        question: string;
        options: string[];
        answer: number;
    }

    interface Module {
        id: string;
        title: string;
        description: string;
        category: string;
        points: number;
        type: 'VIDEO' | 'DOCUMENT';
        contentUrl: string;
        quizData: QuizQuestion[];
        completions?: { id: string }[];
    }

    const [modules, setModules] = useState<Module[]>([]);
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);
    const [showQuiz, setShowQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setLoading(true);
        const res = await fetch('/api/lms');
        if (res.ok) {
            const data = await res.json();
            setModules(Array.isArray(data) ? data : []);
        }
        setLoading(false);
    }

    const startModule = (module: Module) => {
        setSelectedModule(module);
        setShowQuiz(false);
        setQuizResult(null);
        setQuizAnswers([]);
    }

    const startQuiz = () => {
        if (!selectedModule) return;
        setQuizAnswers(new Array(selectedModule.quizData.length).fill(-1));
        setShowQuiz(true);
    }

    const submitQuiz = async () => {
        if (!selectedModule) return;
        const correctCount = selectedModule.quizData.filter((q, i) => q.answer === quizAnswers[i]).length;
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
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 space-y-4">
                        <Skeleton className="w-full aspect-video rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                )) : modules.map(module => {
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
                                {isCompleted && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const win = window.open('', '', 'width=800,height=600');
                                            if (win) {
                                                win.document.write(`
                                                    <html>
                                                    <head>
                                                        <title>Sertifika - ${module.title}</title>
                                                        <style>
                                                            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Roboto:wght@300;400;700&display=swap');
                                                            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f0f0; }
                                                            .certificate {
                                                                width: 800px; height: 600px; padding: 40px; background: white; text-align: center; border: 20px solid #1e1b4b; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                                                            }
                                                            .inner-border { border: 2px solid #daa520; height: 100%; position: relative; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; }
                                                            h1 { font-family: 'Cinzel', serif; font-size: 50px; color: #1e1b4b; margin: 0 0 10px 0; letter-spacing: 5px; }
                                                            .subtitle { font-family: 'Roboto', sans-serif; font-size: 18px; color: #64748b; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
                                                            .recipient { font-family: 'Great Vibes', cursive; font-size: 60px; color: #daa520; margin: 20px 0; border-bottom: 1px solid #e2e8f0; display: inline-block; padding: 0 40px; }
                                                            .course { font-family: 'Roboto', sans-serif; font-size: 24px; font-weight: bold; color: #1e1b4b; margin: 20px 0; }
                                                            .text { font-family: 'Roboto', sans-serif; color: #64748b; line-height: 1.6; }
                                                            .footer { margin-top: 50px; display: flex; justify-content: space-around; align-items: flex-end; }
                                                            .signature { border-top: 1px solid #1e1b4b; padding-top: 10px; font-family: 'Cinzel', serif; font-size: 14px; width: 200px; }
                                                            .seal { width: 100px; height: 100px; background: #daa520; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: 'Cinzel', serif; font-size: 12px; margin: 0 auto; box-shadow: 0 0 0 5px rgba(218,165,32,0.3); }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="certificate">
                                                            <div class="inner-border">
                                                                <h1>SERTİFİKA</h1>
                                                                <div class="subtitle">BAŞARI BELGESİ</div>
                                                                <div class="text">Sayın</div>
                                                                <div class="recipient">Katılımcı</div>
                                                                <div class="text">Aşağıdaki eğitimi başarıyla tamamlamıştır:</div>
                                                                <div class="course">${module.title}</div>
                                                                <div class="text">Bu belge, gösterdiği başarı ve azim için verilmiştir.</div>
                                                                
                                                                <div class="footer">
                                                                    <div class="signature">
                                                                        <div style="font-family: 'Great Vibes'; font-size: 24px; margin-bottom: 5px;">Personel Takip A.Ş.</div>
                                                                        EĞİTİM DİREKTÖRÜ
                                                                    </div>
                                                                    <div class="seal">
                                                                        RESMİ<br>BELGE
                                                                    </div>
                                                                    <div class="signature">
                                                                        ${new Date().toLocaleDateString('tr-TR')}
                                                                        <br>TARİH
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <script>window.onload = () => window.print();</script>
                                                    </body>
                                                    </html>
                                                `);
                                                win.document.close();
                                            }
                                        }}
                                        className="w-full mt-2 py-2 rounded-2xl text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Award className="h-3 w-3" />
                                        Sertifika Görüntüle
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Content View Modal */}
            {
                selectedModule && !showQuiz && (
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
                )
            }

            {/* Quiz View Full Screen Overlay */}
            {
                selectedModule && showQuiz && (
                    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-5 duration-300">
                        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <BrainCircuit className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900 leading-none">Eğitim Testi</h2>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{selectedModule.title}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowQuiz(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="h-6 w-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 content-start">
                            {quizResult === null ? (
                                <div className="space-y-8 pb-20 max-w-2xl mx-auto pt-2">
                                    {selectedModule.quizData.map((q, i) => (
                                        <div key={i} className="space-y-3">
                                            <p className="font-bold text-slate-800 text-base leading-snug">
                                                <span className="text-indigo-600 mr-2 text-lg">{i + 1}.</span> {q.question}
                                            </p>
                                            <div className="grid gap-2">
                                                {q.options.map((opt: string, oi: number) => (
                                                    <button
                                                        key={oi}
                                                        onClick={() => {
                                                            const newA = [...quizAnswers];
                                                            newA[i] = oi;
                                                            setQuizAnswers(newA);
                                                        }}
                                                        className={cn(
                                                            "text-left px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm leading-snug active:scale-[0.98]",
                                                            quizAnswers[i] === oi
                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                                        )}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {quizResult === null && (
                            <div className="p-4 bg-white border-t border-slate-200 safe-area-bottom">
                                <button
                                    disabled={quizAnswers.includes(-1)}
                                    onClick={submitQuiz}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    Testi Bitir & Puanı Kap
                                </button>
                            </div>
                        )}

                        {/* Result View */}
                        {quizResult !== null && (
                            <div className="absolute inset-0 bg-white z-20 flex flex-col items-center justify-center p-8 animate-in zoom-in-95">
                                <ConfettiEffect />
                                <div className={cn(
                                    "w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-xl mb-6",
                                    quizResult >= 60 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}>
                                    {quizResult >= 60 ? <CheckCircle2 className="h-12 w-12" /> : <X className="h-12 w-12" />}
                                </div>

                                <h2 className="text-3xl font-black text-slate-900 mb-2">%{quizResult} Skoru</h2>
                                <p className="text-slate-500 font-medium text-center max-w-xs mb-8">
                                    {quizResult >= 60
                                        ? "Harika! Testi başarıyla geçtin ve ödül puanlarını kazandın."
                                        : "Maalesef yeterli skoru alamadın. Tekrar deneyebilirsin."}
                                </p>

                                <button
                                    onClick={() => {
                                        setSelectedModule(null);
                                        setShowQuiz(false);
                                        setQuizResult(null);
                                    }}
                                    className="bg-slate-900 text-white px-10 py-3 rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95 z-30"
                                >
                                    Kapat
                                </button>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}

function ConfettiEffect() {
    useEffect(() => {
        import("canvas-confetti").then((confetti) => {
            confetti.default({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        });
    }, []);
    return null;
}
