"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Plus, PieChart, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function SurveyPage() {
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // View Results State
    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);

    // Form
    const [title, setTitle] = useState("");
    const [questionText, setQuestionText] = useState("");

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
        // Create a simple one-question survey for demo
        const questions = [
            { id: 1, text: questionText, type: 'RATING' }
        ];

        await fetch('/api/survey', {
            method: 'POST',
            body: JSON.stringify({ action: 'CREATE', title, questions }),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setTitle("");
        setQuestionText("");
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Anketler</h1>
                    <p className="text-slate-500">Personel memnuniyeti ve geri bildirimler</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Anket Oluştur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map(survey => (
                    <div key={survey.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Aktif</span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-lg mb-2">{survey.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2">
                            {(survey.questions as any)[0]?.text}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="text-xs text-slate-500">
                                <span className="font-bold text-slate-900 text-lg">{survey._count.responses}</span> Yanıt
                            </div>
                            <button className="text-sm font-bold text-purple-600 flex items-center gap-1 hover:underline">
                                <PieChart className="h-4 w-4" /> Sonuçlar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

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
