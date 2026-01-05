"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, CheckCircle2, Trash2, Power, Eye, TrendingUp, X, Bot, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SurveyPage() {
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // View Results State
    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
    const [resultsModal, setResultsModal] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

    // Form
    const [title, setTitle] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [includeComments, setIncludeComments] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/survey');
            const data = await res.json();
            setSurveys(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const questions: any[] = [
            { id: 1, text: questionText, type: 'RATING' }
        ];

        if (includeComments) {
            questions.push({ id: 2, text: "Görüş ve Önerileriniz", type: "TEXT" });
        }

        await fetch('/api/survey', {
            method: 'POST',
            body: JSON.stringify({ action: 'CREATE', title, questions }),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setTitle("");
        setQuestionText("");
        setIncludeComments(false);
        fetchData();
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? "Anketi pasife almak istiyor musunuz?" : "Anketi aktif etmek istiyor musunuz?")) return;

        await fetch('/api/survey', {
            method: 'PATCH',
            body: JSON.stringify({ id, isActive: !currentStatus }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bu anketi ve tüm yanıtlarını silmek istediğinize emin misiniz?")) return;

        await fetch('/api/survey', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const handleShowResults = (survey: any) => {
        // Calculate basic stats for the single rating question
        let totalScore = 0;
        let count = 0;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as any;

        survey.responses.forEach((r: any) => {
            const val = r.answers?.["1"]; // Assuming question ID 1
            if (typeof val === 'number') {
                totalScore += val;
                count++;
                if (distribution[val] !== undefined) distribution[val]++;
            }
        });

        const average = count > 0 ? (totalScore / count).toFixed(1) : "0.0";

        setSelectedSurvey({
            ...survey,
            stats: { average, count, distribution }
        });
        setAiSummary(null); // Reset summary
        setResultsModal(true);
    };

    const analyzeComments = async () => {
        if (!selectedSurvey) return;

        setAiSummary("AI Analizi yapılıyor... ⏳");

        try {
            const res = await fetch('/api/survey/analyze', {
                method: 'POST',
                body: JSON.stringify({ surveyId: selectedSurvey.id }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setAiSummary(data.summary);
        } catch (e) {
            setAiSummary("Analiz başarısız oldu.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Anketler</h1>
                    <p className="text-slate-500">Personel memnuniyeti ve geri bildirim yönetimi</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Anket Oluştur
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {surveys.map(survey => (
                        <div key={survey.id} className={cn("bg-white p-6 rounded-xl border shadow-sm transition group", !survey.isActive ? "opacity-75 border-slate-200" : "border-slate-200 hover:shadow-md")}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-lg", survey.isActive ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-400")}>
                                    <MessageSquare className="h-6 w-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-2 py-1 rounded text-xs font-bold", survey.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
                                        {survey.isActive ? "Aktif" : "Pasif"}
                                    </span>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg mb-2">{survey.title}</h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">
                                {(survey.questions as any)[0]?.text}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-900 text-lg">{survey._count?.responses || 0}</span> Yanıt
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => handleToggleStatus(survey.id, survey.isActive)} title={survey.isActive ? "Pasife al" : "Aktif et"} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full">
                                        <Power className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleShowResults(survey)} title="Sonuçları Gör" className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full">
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(survey.id)} title="Sil" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* RESULTS MODAL */}
            {resultsModal && selectedSurvey && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedSurvey.title}</h2>
                                <p className="text-slate-500 text-sm">Anket Sonuçları</p>
                            </div>
                            <button onClick={() => setResultsModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-indigo-50 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-indigo-900">{selectedSurvey.stats.count}</p>
                                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">TOPLAM OY</p>
                                </div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl flex items-center gap-4 col-span-2">
                                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-green-900">{selectedSurvey.stats.average}</p>
                                        <span className="text-sm text-green-600 font-medium">/ 5.0</span>
                                    </div>
                                    <p className="text-xs font-bold text-green-400 uppercase tracking-wider">ORTALAMA PUAN</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <h3 className="font-bold text-slate-900 mb-4">Puan Dağılımı</h3>
                            {[5, 4, 3, 2, 1].map(score => {
                                const count = selectedSurvey.stats.distribution[score] || 0;
                                const percentage = selectedSurvey.stats.count > 0 ? (count / selectedSurvey.stats.count) * 100 : 0;
                                return (
                                    <div key={score} className="flex items-center gap-4">
                                        <div className="w-12 text-sm font-bold text-slate-600 flex items-center gap-1">
                                            {score} <span className="text-slate-400 font-normal">Yıldız</span>
                                        </div>
                                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500",
                                                    score >= 4 ? "bg-green-500" : score === 3 ? "bg-yellow-400" : "bg-red-500"
                                                )}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="w-12 text-right text-xs font-bold text-slate-500">
                                            {count} Oy
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* AI Section */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                                    <Bot className="h-5 w-5" />
                                    AI Yorum Analizi
                                </h3>
                                <button
                                    onClick={analyzeComments}
                                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition"
                                >
                                    Analiz Et / Özetle
                                </button>
                            </div>
                            <div className="bg-white/60 p-4 rounded-xl text-sm text-slate-700 leading-relaxed font-medium min-h-[60px]">
                                {aiSummary ? aiSummary : "Öneri ve şikayetlerdeki ortak noktaları bulmak için 'Analiz Et' butonuna tıklayın."}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Anket</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Anket Başlığı</label>
                                <input required className="w-full border rounded-lg p-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Yemekhane Memnuniyeti" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Soru (Puanlama 1-5)</label>
                                <textarea required className="w-full border rounded-lg p-2 h-24" value={questionText} onChange={e => setQuestionText(e.target.value)} placeholder="Örn: Yemeklerin lezzetinden ne kadar memnunsunuz?" />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="comments"
                                    checked={includeComments}
                                    onChange={e => setIncludeComments(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <label htmlFor="comments" className="text-sm font-medium text-slate-700">Açık uçlu yorum alanı ekle</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Yayınla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
