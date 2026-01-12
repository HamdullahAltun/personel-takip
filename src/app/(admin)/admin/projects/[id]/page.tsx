
"use client";

import { useState, useEffect, use } from "react";
import KanbanBoard from "@/components/admin/projects/KanbanBoard";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

    // Task Form State
    const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/admin/projects/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProject(data);
            } else {
                toast.error("Proje yüklenemedi");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskMove = async (taskId: string, sourceColId: string, destColId: string, newIndex: number) => {
        // Call API to update task column
        try {
            await fetch(`/api/admin/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columnId: destColId })
            });
            // No need to fetchProject here if optimistic UI in KanbanBoard works well, 
            // but strictly speaking we might want to sync eventually.
        } catch (e) {
            console.error(e);
            toast.error("Hata oluştu");
        }
    };

    const handleAddTaskClick = (columnId: string) => {
        setSelectedColumnId(columnId);
        setTaskModalOpen(true);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/admin/projects/${id}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...newTask, columnId: selectedColumnId })
            });

            if (res.ok) {
                toast.success("Görev oluşturuldu");
                setTaskModalOpen(false);
                setNewTask({ title: "", description: "", priority: "MEDIUM" });
                // Reload board to show new task
                fetchProject();
            } else {
                toast.error("Görev oluşturulamadı");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!project) return <div>Proje bulunamadı.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
                    <p className="text-sm text-slate-500">{project.description}</p>
                </div>
                <div className="ml-auto flex -space-x-2">
                    {project.membersDetails?.map((m: any) => (
                        m.profilePicture ? (
                            <img key={m.id} src={m.profilePicture} className="w-8 h-8 rounded-full border-2 border-white" title={m.name} />
                        ) : (
                            <div key={m.id} className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-600" title={m.name}>
                                {m.name.substring(0, 2).toUpperCase()}
                            </div>
                        )
                    ))}
                </div>
            </div>

            <KanbanBoard
                data={project}
                onTaskMove={handleTaskMove}
                onAddTask={handleAddTaskClick}
                onTaskClick={(task) => console.log("Task details", task)}
            />

            {/* Simple Modal for creating task */}
            {taskModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Görev</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Başlık</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Örn: Tasarım bitirilecek"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Detaylar..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Öncelik</label>
                                <select
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newTask.priority}
                                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option value="LOW">Düşük</option>
                                    <option value="MEDIUM">Orta</option>
                                    <option value="HIGH">Yüksek</option>
                                    <option value="URGENT">Acil</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setTaskModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg font-bold">İptal</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
