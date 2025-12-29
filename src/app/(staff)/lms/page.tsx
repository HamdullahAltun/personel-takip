"use client";

import { useState, useEffect } from "react";
import { BookOpen, Video, FileText, CheckCircle2, PlayCircle } from "lucide-react";

export default function StaffLMSPage() {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/lms');
            const data = await res.json();
            setTrainings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (id: string, url: string) => {
        window.open(url, '_blank');
        // Mark as completed
        await fetch('/api/lms', {
            method: 'PATCH',
            body: JSON.stringify({ action: 'COMPLETE', trainingId: id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Eğitim Merkezi</h1>
                <p className="text-slate-500">Kişisel gelişiminiz için eğitim materyalleri</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainings.map(training => {
                    const isCompleted = training.completions?.length > 0;
                    return (
                        <div key={training.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col group hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-lg ${training.type === 'VIDEO' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {training.type === 'VIDEO' ? <Video className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                </div>
                                {isCompleted && (
                                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                                        <CheckCircle2 className="h-3 w-3" /> Tamamlandı
                                    </span>
                                )}
                            </div>

                            <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2">{training.title}</h3>
                            <p className="text-sm text-slate-500 mb-6 line-clamp-3 flex-1">{training.description}</p>

                            <button
                                onClick={() => handleComplete(training.id, training.url)}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition
                                    ${isCompleted
                                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }
                                `}
                            >
                                {training.type === 'VIDEO' ? <PlayCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                                {isCompleted ? 'Tekrar İncele' : 'Başla'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
