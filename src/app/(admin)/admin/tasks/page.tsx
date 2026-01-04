"use client";

import { useState } from 'react';
import { Plus, CheckCircle, Clock, AlertTriangle, Trash2, Calendar, User, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR, { mutate } from 'swr';

type Task = {
    id: string;
    title: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    dueDate: string;
    assignedTo: { id: string, name: string };
    assignedBy: { name: string };
};

const COLUMNS = [
    { id: 'PENDING', title: 'Yapılacaklar', color: 'bg-slate-100', dot: 'bg-slate-500' },
    { id: 'IN_PROGRESS', title: 'Devam Edenler', color: 'bg-blue-50', dot: 'bg-blue-500' },
    { id: 'COMPLETED', title: 'Tamamlananlar', color: 'bg-green-50', dot: 'bg-green-500' },
] as const;

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TasksPage() {
    const { data: tasks = [], isLoading: loadingTasks } = useSWR<Task[]>('/api/tasks', fetcher, { refreshInterval: 5000 });
    const { data: employees = [] } = useSWR<any[]>('/api/users', fetcher);

    const [showModal, setShowModal] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [assignee, setAssignee] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [dueDate, setDueDate] = useState("");

    // Drag State
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title,
                description: desc,
                assignedToId: assignee,
                priority,
                dueDate
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setShowModal(false);
            mutate('/api/tasks');
            setTitle(""); setDesc(""); setAssignee("");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Görevi silmek istiyor musunuz?")) return;

        // Optimistic update
        mutate('/api/tasks', tasks.filter(t => t.id !== id), false);

        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        mutate('/api/tasks');
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.setData("taskId", taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, newStatus: Task['status']) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId) return;
        updateTaskStatus(taskId, newStatus);
    };

    const updateTaskStatus = async (taskId: string, newStatus: string) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
        );

        // Optimistic update
        mutate('/api/tasks', updatedTasks, false);
        setDraggingTaskId(null);

        // API Update
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus }),
            headers: { 'Content-Type': 'application/json' }
        });

        mutate('/api/tasks');
    };

    const getPriorityBadge = (p: string) => {
        const styles = {
            'URGENT': 'text-red-700 bg-red-100 border-red-200',
            'HIGH': 'text-orange-700 bg-orange-100 border-orange-200',
            'MEDIUM': 'text-blue-700 bg-blue-100 border-blue-200',
            'LOW': 'text-slate-600 bg-slate-100 border-slate-200'
        }[p] || 'text-slate-600 bg-slate-100';

        const labels = { 'URGENT': 'Acil', 'HIGH': 'Yüksek', 'MEDIUM': 'Orta', 'LOW': 'Düşük' }[p] || p;

        return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${styles}`}>{labels}</span>;
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6 px-4 md:px-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Görev Panosu</h1>
                    <p className="text-slate-500 hidden md:block">Projeleri ve görevleri sürükleyerek yönetin</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    <span className="hidden md:inline">Yeni Görev</span>
                    <span className="md:hidden">Ekle</span>
                </button>
            </div>

            {/* Mobile-First Scalable Board Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory">
                <div className="flex h-full gap-4 lg:gap-6 w-max lg:w-full min-w-full">
                    {COLUMNS.map(col => (
                        <div
                            key={col.id}
                            className={`flex flex-col rounded-2xl ${col.color} border border-slate-200/50 backdrop-blur-sm 
                                w-[85vw] sm:w-[350px] lg:flex-1 max-h-full snap-center shrink-0`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between border-b border-slate-200/50 sticky top-0 bg-inherit z-10 rounded-t-2xl">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${col.dot} shadow-sm`} />
                                    <h2 className="font-bold text-slate-700">{col.title}</h2>
                                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs text-slate-500 font-medium">
                                        {tasks.filter(t => t.status === col.id).length}
                                    </span>
                                </div>
                            </div>

                            {/* Column Content */}
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                                <AnimatePresence>
                                    {tasks
                                        .filter(t => t.status === col.id)
                                        .map(task => (
                                            <motion.div
                                                layoutId={task.id}
                                                key={task.id}
                                                draggable
                                                onDragStart={(e: any) => handleDragStart(e, task.id)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing group relative hover:shadow-md transition-all ${draggingTaskId === task.id ? 'opacity-50 rotate-3' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    {getPriorityBadge(task.priority)}

                                                    {/* Mobile Dropdown for moving between columns */}
                                                    <div className="flex items-center gap-1">
                                                        <select
                                                            className="lg:hidden text-[10px] bg-slate-50 border border-slate-200 rounded py-1 px-1 text-slate-600 outline-none max-w-[80px]"
                                                            value={task.status}
                                                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                        </select>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                                            className="text-slate-300 hover:text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-slate-800 mb-1 leading-tight">{task.title}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>

                                                <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded max-w-[60%] truncate">
                                                        <User className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{task.assignedTo?.name || "Atanmadı"}</span>
                                                    </div>

                                                    {task.dueDate && (
                                                        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${new Date(task.dueDate) < new Date() ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}>
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(task.dueDate).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                                {!loadingTasks && tasks.filter(t => t.status === col.id).length === 0 && (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-lg min-h-[100px]">
                                        Görev yok
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <h2 className="text-xl font-bold mb-6 text-slate-800">Yeni Görev Oluştur</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Başlık</label>
                                <input
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    placeholder="Örn: Pazarlama Raporu"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Açıklama</label>
                                <textarea
                                    className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition h-24 resize-none"
                                    placeholder="Detaylar..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Kime</label>
                                    <select
                                        className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={assignee}
                                        onChange={e => setAssignee(e.target.value)}
                                        required
                                    >
                                        <option value="">Seçiniz</option>
                                        {employees.map((u: any) => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Öncelik</label>
                                    <select
                                        className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={priority}
                                        onChange={e => setPriority(e.target.value)}
                                    >
                                        <option value="LOW">Düşük</option>
                                        <option value="MEDIUM">Orta</option>
                                        <option value="HIGH">Yüksek</option>
                                        <option value="URGENT">Acil</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1 block">Son Tarih</label>
                                <input
                                    type="date"
                                    className="w-full border border-slate-300 p-2.5 rounded-lg"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium hover:bg-slate-200 transition">İptal</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Oluştur</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
