"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ClipboardList, Calendar, CheckCircle, Clock, AlertCircle, PlayCircle, StopCircle } from "lucide-react";

type Task = {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string | null;
    assignedBy: { name: string };
};

export default function StaffTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/tasks'); // API handles "assigned to me" logic for staff role
            if (res.ok) {
                const data = await res.json();
                setTasks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateStatus = async (id: string, newStatus: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) fetchTasks(); // Revert on error
        } catch {
            fetchTasks();
        }
    };

    const getPriorityBadge = (p: string) => {
        const styles = {
            LOW: "bg-slate-100 text-slate-600",
            MEDIUM: "bg-blue-100 text-blue-600",
            HIGH: "bg-orange-100 text-orange-600",
            URGENT: "bg-red-100 text-red-600"
        };
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${styles[p as keyof typeof styles]}`}>
                {p === 'LOW' ? 'Düşük' : p === 'MEDIUM' ? 'Orta' : p === 'HIGH' ? 'Yüksek' : 'Acil'}
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

    const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Görevlerim</h1>
            </div>

            {pendingTasks.length === 0 && completedTasks.length === 0 && (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400">Henüz atanmış bir görev yok.</p>
                </div>
            )}

            {/* Pending / In Progress List */}
            <div className="space-y-4">
                {pendingTasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${task.priority === 'URGENT' ? 'bg-red-500' : task.priority === 'HIGH' ? 'bg-orange-500' : 'bg-blue-500'}`} />

                        <div className="pl-3">
                            <div className="flex justify-between items-start mb-2">
                                {getPriorityBadge(task.priority)}
                                <span className="text-xs text-slate-400 font-medium">
                                    {task.dueDate ? format(new Date(task.dueDate), "d MMM", { locale: tr }) : 'Tarihsiz'}
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg mb-1">{task.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{task.description}</p>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="font-medium text-slate-600">Atayan:</span>
                                    {task.assignedBy?.name.split(' ')[0]}
                                </div>

                                <div className="flex gap-2">
                                    {task.status === 'PENDING' && (
                                        <button
                                            onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                                        >
                                            <PlayCircle className="h-4 w-4" />
                                            Başla
                                        </button>
                                    )}
                                    {task.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => updateStatus(task.id, 'COMPLETED')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            Tamamla
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Completed List (Collapsed/Separate) */}
            {completedTasks.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Tamamlananlar</h3>
                    <div className="space-y-3 opacity-60">
                        {completedTasks.map(task => (
                            <div key={task.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-slate-700 line-through decoration-slate-400">{task.title}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
