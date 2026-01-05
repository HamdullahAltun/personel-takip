"use client";

import { useState, useEffect } from "react";
import { PlayCircle, CheckCircle2, BookOpen, Plus, BrainCircuit, Save, X, Trash2, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLMSPage() {
    const [modules, setModules] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        contentUrl: "",
        type: "VIDEO",
        category: "TECHNICAL",
        points: "10"
    });
    const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null);
    const [editingQuiz, setEditingQuiz] = useState<any | null>(null);

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        const res = await fetch('/api/lms');
        if (res.ok) setModules(await res.json());
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/lms', {
            method: 'POST',
            body: JSON.stringify({ action: 'CREATE', ...formData }),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ title: "", description: "", contentUrl: "", type: "VIDEO", category: "TECHNICAL", points: "10" });
        fetchModules();
    }

    const generateAIQuiz = async (module: any) => {
        setGeneratingQuiz(module.id);
        try {
            const res = await fetch('/api/lms', {
                method: 'POST',
                body: JSON.stringify({ action: 'GENERATE_QUIZ', title: module.title, description: module.description }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.quiz) {
                // Save immediately or let admin edit
                setEditingQuiz({ moduleId: module.id, questions: data.quiz });
            }
        } catch (e) {
            console.error(e);
        }
        setGeneratingQuiz(null);
    }

    const saveQuiz = async () => {
        await fetch('/api/lms', {
            method: 'POST',
            body: JSON.stringify({ action: 'UPDATE_QUIZ', moduleId: editingQuiz.moduleId, quizData: editingQuiz.questions }),
            headers: { 'Content-Type': 'application/json' }
        });
        setEditingQuiz(null);
        fetchModules();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Akıllı Eğitim Yönetimi (LMS)</h1>
                    <p className="text-slate-500">AI destekli eğitimler oluşturun ve yetkinlikleri ölçün</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                    <Plus className="h-4 w-4" /> Eğitim Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(module => (
                    <div key={module.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-xl transition-all duration-300">
                        <div className="aspect-video bg-slate-100 relative overflow-hidden">
                            {module.type === 'VIDEO' ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/10 group-hover:bg-indigo-900/20 transition">
                                    <PlayCircle className="h-16 w-16 text-indigo-600 opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/10">
                                    <BookOpen className="h-16 w-16 text-blue-600 opacity-80" />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 shadow-sm border border-white/50">
                                    {module.category}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="bg-amber-500 text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                    <Award className="h-3 w-3" /> {module.points} Puan
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-1">{module.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{module.description}</p>

                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                                {module.quizData ? (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        <CheckCircle2 className="h-3 w-3" /> Quiz Hazır
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => generateAIQuiz(module)}
                                        disabled={generatingQuiz === module.id}
                                        className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                    >
                                        <BrainCircuit className="h-3 w-3" />
                                        {generatingQuiz === module.id ? 'Sorular Hazırlanıyor...' : 'AI Seçin (Quiz Üret)'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 animate-in zoom-in-95 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Yeni Eğitim Modülü</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Başlık</label>
                                    <input required className="w-full border-slate-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Örn: İleri Excel Eğitimi" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                                    <textarea required className="w-full border-slate-200 border rounded-xl p-3 h-24 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Eğitim içeriğinde neler var?" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
                                    <select className="w-full border-slate-200 border rounded-xl p-3 outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                        <option value="TECHNICAL">Teknik</option>
                                        <option value="SOFT_SKILLS">Sosyal Beceri</option>
                                        <option value="COMPLIANCE">Yönetmelik</option>
                                        <option value="ONBOARDING">Oryantasyon</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Eğitim Puanı</label>
                                    <input required type="number" className="w-full border-slate-200 border rounded-xl p-3 outline-none" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">İçerik URL (YouTube/MP4/PDF)</label>
                                    <input required className="w-full border-slate-200 border rounded-xl p-3 outline-none" value={formData.contentUrl} onChange={e => setFormData({ ...formData, contentUrl: e.target.value })} placeholder="https://..." />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
                                <button type="submit" className="flex-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">Eğitimi Yayınla</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quiz Editor Full Screen Overlay */}
            {editingQuiz && (
                <div className="fixed inset-0 bg-white z-[100] overflow-hidden flex flex-col animate-in fade-in duration-200">
                    {/* Header */}
                    <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <BrainCircuit className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">AI Quiz Editörü</h2>
                                <p className="text-xs text-slate-500">Soruları düzenle ve yayınla</p>
                            </div>
                        </div>
                        <button onClick={() => setEditingQuiz(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {(editingQuiz?.questions && Array.isArray(editingQuiz.questions) ? editingQuiz.questions : []).map((q: any, i: number) => (
                                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative group">
                                    <div className="absolute top-4 right-4 text-slate-200 font-black text-4xl opacity-20 pointer-events-none">
                                        {i + 1}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Soru</label>
                                                <input
                                                    className="w-full bg-slate-50 font-bold text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                                    value={q.question}
                                                    onChange={(e) => {
                                                        const newQ = [...editingQuiz.questions];
                                                        newQ[i].question = e.target.value;
                                                        setEditingQuiz({ ...editingQuiz, questions: newQ });
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Seçenekler</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((opt: string, oi: number) => (
                                                        <div key={oi} className={cn(
                                                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer hover:border-indigo-100",
                                                            q.answer === oi ? "bg-green-50/50 border-green-500/50" : "bg-white border-slate-100"
                                                        )}>
                                                            <input
                                                                type="radio"
                                                                name={`question-${i}`}
                                                                checked={q.answer === oi}
                                                                onChange={() => {
                                                                    const newQ = [...editingQuiz.questions];
                                                                    newQ[i].answer = oi;
                                                                    setEditingQuiz({ ...editingQuiz, questions: newQ });
                                                                }}
                                                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                            />
                                                            <input
                                                                className="flex-1 bg-transparent text-sm font-medium outline-none"
                                                                value={opt}
                                                                onChange={(e) => {
                                                                    const newQ = [...editingQuiz.questions];
                                                                    newQ[i].options[oi] = e.target.value;
                                                                    setEditingQuiz({ ...editingQuiz, questions: newQ });
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 bg-white flex justify-center gap-4">
                        <button onClick={() => setEditingQuiz(null)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">İptal</button>
                        <button onClick={saveQuiz} className="px-12 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Save className="h-5 w-5" /> Kaydet ve Yayınla
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
