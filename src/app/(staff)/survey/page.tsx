"use client";

import { useState, useEffect } from "react";
import { MessageSquare, PieChart, CheckCircle2 } from "lucide-react";

export default function StaffSurveyPage() {
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState<string[]>([]); // Survey IDs

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/survey');
            const data = await res.json();
            setSurveys(data);

            // Initialize submitted state from server
            const alreadyVoted = data.filter((s: any) => s.hasResponded).map((s: any) => s.id);
            setSubmitted(alreadyVoted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (surveyId: string) => {
        await fetch('/api/survey', {
            method: 'POST',
            body: JSON.stringify({ action: 'RESPOND', surveyId, answers: answers[surveyId] }),
            headers: { 'Content-Type': 'application/json' }
        });
        setSubmitted([...submitted, surveyId]);
        alert("Yanıtınız kaydedildi!");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Anketler</h1>
                    <p className="text-slate-500">Geri bildirimlerinizi paylaşın</p>
                </div>
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

                        {(survey.questions as any[]).map((q, idx) => (
                            <div key={idx} className="mb-4">
                                <p className="text-sm font-medium text-slate-700 mb-2">{q.text}</p>
                                {submitted.includes(survey.id) ? (
                                    <div className="text-green-600 font-bold text-sm">Yanıtlandı ✓</div>
                                ) : q.type === 'TEXT' ? (
                                    <textarea
                                        rows={3}
                                        placeholder="Yorumunuzu yazın..."
                                        className="w-full border rounded-lg p-2 text-sm"
                                        onChange={(e) => setAnswers({ ...answers, [survey.id]: { ...answers[survey.id], [q.id]: e.target.value } })}
                                        value={answers[survey.id]?.[q.id] || ""}
                                    />
                                ) : (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(score => (
                                            <button
                                                key={score}
                                                onClick={() => setAnswers({ ...answers, [survey.id]: { ...answers[survey.id], [q.id]: score } })}
                                                className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${answers[survey.id]?.[q.id] === score ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {!submitted.includes(survey.id) && (
                            <button
                                onClick={() => handleSubmit(survey.id)}
                                className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition"
                            >
                                Gönder
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
