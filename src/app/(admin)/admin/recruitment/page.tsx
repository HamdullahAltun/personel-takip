"use client";

import { useState, useEffect } from "react";
import { Briefcase, UserPlus, Users, Search, ChevronRight, CheckCircle2, XCircle, Clock, Star, Plus, Pencil, Trash, BrainCircuit } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function RecruitmentPage() {
    const [view, setView] = useState<'BOARD' | 'JOBS'>('BOARD');
    const [jobs, setJobs] = useState<any[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobForm, setJobForm] = useState({ title: "", department: "", type: "FULL_TIME", description: "", requirements: "" });
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const jobsRes = await fetch('/api/recruitment?mode=jobs');
            const jobsData = await jobsRes.json();
            setJobs(jobsData);

            const candRes = await fetch('/api/recruitment?mode=candidates');
            const candData = await candRes.json();
            setCandidates(candData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editMode) {
            await fetch('/api/recruitment', {
                method: 'PATCH',
                body: JSON.stringify({ id: editingId, target: 'JOB', ...jobForm }),
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            await fetch('/api/recruitment', {
                method: 'POST',
                body: JSON.stringify({ action: 'CREATE_JOB', ...jobForm }),
                headers: { 'Content-Type': 'application/json' }
            });
        }

        setShowJobModal(false);
        setEditMode(false);
        setEditingId("");
        setJobForm({ title: "", department: "", type: "FULL_TIME", description: "", requirements: "" });
        fetchData();
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm("İlanı silmek istediğinize emin misiniz?")) return;
        await fetch('/api/recruitment', {
            method: 'DELETE',
            body: JSON.stringify({ id, target: 'JOB' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const openEditModal = (job: any) => {
        setJobForm({
            title: job.title,
            department: job.department,
            type: job.type,
            description: job.description,
            requirements: job.requirements
        });
        setEditingId(job.id);
        setEditMode(true);
        setShowJobModal(true);
    };

    const updateCandidateStatus = async (id: string, status: string) => {
        await fetch('/api/recruitment', {
            method: 'PATCH',
            body: JSON.stringify({ id: id, type: 'CANDIDATE', status }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const KanbanColumn = ({ status, title, color }: { status: string, title: string, color: string }) => {
        const items = candidates.filter(c => c.status === status);
        return (
            <div className="flex-1 min-w-[280px]">
                <div className={`p-3 rounded-t-xl border-b-2 font-bold flex justify-between items-center ${color}`}>
                    <h3>{title}</h3>
                    <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="bg-slate-50/50 p-2 min-h-[500px] border-x border-b border-slate-200 rounded-b-xl space-y-3">
                    {items.map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition text-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-slate-800">{c.name}</h4>
                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{c.jobPosting.title}</span>
                            </div>
                            <p className="text-slate-500 text-xs mb-2">{c.email}</p>

                            <div className="flex items-center justify-between mb-3 border-t border-slate-50 pt-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} className={`h-3 w-3 ${star <= c.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                    ))}
                                </div>
                                {c.aiScore ? (
                                    <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-100" title={c.aiNotes}>
                                        <BrainCircuit className="h-3 w-3" />
                                        %{c.aiScore} Uyumluluk
                                    </div>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            const res = await fetch("/api/ai/analyze-candidate", {
                                                method: "POST",
                                                body: JSON.stringify({ candidateId: c.id })
                                            });
                                            if (res.ok) fetchData();
                                        }}
                                        className="text-[9px] bg-slate-900 text-white px-2 py-0.5 rounded flex items-center gap-1 hover:bg-slate-800 transition shadow-sm font-bold"
                                    >
                                        <BrainCircuit className="h-2 w-2" />
                                        AI ANALİZ
                                    </button>
                                )}
                            </div>

                            <div className="flex justify-between gap-2 pt-2 border-t border-slate-50">
                                {status !== 'NEW' && (
                                    <button onClick={() => updateCandidateStatus(c.id, 'NEW')} className="text-xs text-slate-400 hover:text-slate-600">←</button>
                                )}
                                <div className="flex gap-1 ml-auto">
                                    {status !== 'HIRED' && status !== 'REJECTED' && (
                                        <>
                                            <button onClick={() => updateCandidateStatus(c.id, 'HIRED')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle2 className="h-4 w-4" /></button>
                                            <button onClick={() => updateCandidateStatus(c.id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="h-4 w-4" /></button>
                                            {status === 'NEW' && <button onClick={() => updateCandidateStatus(c.id, 'INTERVIEW')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Mülakat</button>}
                                            {status === 'INTERVIEW' && <button onClick={() => updateCandidateStatus(c.id, 'OFFER')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">Teklif</button>}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">İşe Alım Portalı</h1>
                    <p className="text-slate-500">Aday takibi ve iş ilanları</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                        <button onClick={() => setView('BOARD')} className={`px-3 py-1.5 rounded-md transition ${view === 'BOARD' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Aday Panosu</button>
                        <button onClick={() => setView('JOBS')} className={`px-3 py-1.5 rounded-md transition ${view === 'JOBS' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>İlanlar</button>
                    </div>
                    <button onClick={() => {
                        setEditMode(false);
                        setJobForm({ title: "", department: "", type: "FULL_TIME", description: "", requirements: "" });
                        setShowJobModal(true);
                    }} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> İlan Aç
                    </button>
                </div>
            </div>

            {view === 'BOARD' ? (
                <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
                    <KanbanColumn status="NEW" title="Yeni Başvuru" color="bg-blue-50 border-blue-200 text-blue-700" />
                    <KanbanColumn status="INTERVIEW" title="Mülakat" color="bg-yellow-50 border-yellow-200 text-yellow-700" />
                    <KanbanColumn status="OFFER" title="Teklif" color="bg-purple-50 border-purple-200 text-purple-700" />
                    <KanbanColumn status="HIRED" title="İşe Alındı" color="bg-green-50 border-green-200 text-green-700" />
                    <KanbanColumn status="REJECTED" title="Reddedildi" color="bg-red-50 border-red-200 text-red-700" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                {job.status === 'ACTIVE' ? 'Yayında' : 'Kapalı'}
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 mb-1">{job.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{job.department} • {job.type}</p>

                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 bg-slate-50 p-2 rounded">
                                <Users className="h-4 w-4" />
                                <span className="font-bold">{job._count.candidates}</span> Başvuru
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                                <span>{format(new Date(job.createdAt), 'd MMM yyyy', { locale: tr })}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(job)} className="text-blue-600 hover:text-blue-700 bg-blue-50 p-1.5 rounded-lg"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => handleDeleteJob(job.id)} className="text-red-600 hover:text-red-700 bg-red-50 p-1.5 rounded-lg"><Trash className="h-4 w-4" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showJobModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">{editMode ? 'İlanı Düzenle' : 'Yeni İş İlanı Aç'}</h2>
                        <form onSubmit={handleCreateJob} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pozisyon Adı</label>
                                <input required className="w-full border rounded-lg p-2" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Örn: Frontend Developer" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Departman</label>
                                    <input required className="w-full border rounded-lg p-2" value={jobForm.department} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} placeholder="Yazılım" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Çalışma Tipi</label>
                                    <select className="w-full border rounded-lg p-2" value={jobForm.type} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}>
                                        <option value="FULL_TIME">Tam Zamanlı</option>
                                        <option value="PART_TIME">Yarı Zamanlı</option>
                                        <option value="REMOTE">Uzaktan</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                                <textarea required className="w-full border rounded-lg p-2 h-24" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Gereklilikler</label>
                                <textarea required className="w-full border rounded-lg p-2 h-24" value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowJobModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{editMode ? 'Güncelle' : 'Yayınla'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
