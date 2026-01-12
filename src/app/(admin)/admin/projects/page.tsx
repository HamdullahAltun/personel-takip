"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Calendar, Users as UsersIcon, Loader2, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ title: "", description: "" });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/admin/projects");
            if (res.ok) setProjects(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch("/api/admin/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProject)
            });
            if (res.ok) {
                setShowModal(false);
                setNewProject({ title: "", description: "" });
                fetchProjects();
            }
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
                    <p className="text-slate-500">Takım projelerini ve görevlerini yönetin.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Proje
                </button>
            </div>

            {/* Project List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition cursor-pointer group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                    <FolderKanban className="h-5 w-5" />
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition line-clamp-1">{project.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                                {project.description}
                            </p>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Bekleyen Görevler</span>
                                    <span>{project._count?.tasks || 0}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                                <div className="flex -space-x-2">
                                    {/* Placeholder avatars until we fetch members */}
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600">
                                        {(project.manager?.name || "A").substring(0, 2).toUpperCase()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(new Date(project.createdAt), "d MMM", { locale: tr })}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => setShowModal(true)}
                        className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition gap-3 min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="font-medium">Yeni Proje Oluştur</span>
                    </button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Proje</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Proje Adı</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newProject.title}
                                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                    placeholder="Örn: Web Sitesi Yenileme"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Proje detayları..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-bold">İptal</button>
                                <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
