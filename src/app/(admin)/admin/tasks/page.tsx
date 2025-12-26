"use client";

import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Clock, AlertTriangle, Trash2, Calendar } from 'lucide-react';

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

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [assignee, setAssignee] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [dueDate, setDueDate] = useState("");

    const fetchTasks = async () => {
        const res = await fetch('/api/tasks');
        if (res.ok) setTasks(await res.json());
        setLoading(false);
    };

    const fetchEmployees = async () => {
        const res = await fetch('/api/users'); // Reuse existing if available or creates basic list
        if (res.ok) setEmployees(await res.json());
    };

    useEffect(() => {
        fetchTasks();
        fetchEmployees();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/tasks', {
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
        setShowModal(false);
        fetchTasks();
        // Reset form
        setTitle(""); setDesc(""); setAssignee("");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Görevi silmek istiyor musunuz?")) return;
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        fetchTasks();
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'text-red-600 bg-red-100 border-red-200';
            case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
            case 'MEDIUM': return 'text-blue-600 bg-blue-100 border-blue-200';
            default: return 'text-slate-600 bg-slate-100 border-slate-200';
        }
    };

    const getStatusIcon = (s: string) => {
        switch (s) {
            case 'COMPLETED': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'IN_PROGRESS': return <Clock className="h-5 w-5 text-blue-500" />;
            default: return <AlertTriangle className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Görev Yönetimi</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Görev
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 group relative">
                        <div className="flex justify-between items-start mb-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                            {getStatusIcon(task.status)}
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>

                        <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-600">Atanan:</span>
                                {task.assignedTo?.name}
                            </div>
                            {task.dueDate && (
                                <div className="flex items-center gap-2 text-red-500">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(task.dueDate).toLocaleDateString("tr-TR")}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleDelete(task.id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-lg font-bold mb-4">Yeni Görev</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                className="w-full border p-2 rounded-lg"
                                placeholder="Görev Başlığı"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                            <textarea
                                className="w-full border p-2 rounded-lg"
                                placeholder="Açıklama"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                            />
                            <select
                                className="w-full border p-2 rounded-lg"
                                value={assignee}
                                onChange={e => setAssignee(e.target.value)}
                                required
                            >
                                <option value="">Personel Seç</option>
                                {employees.map((u: any) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="LOW">Düşük</option>
                                    <option value="MEDIUM">Orta</option>
                                    <option value="HIGH">Yüksek</option>
                                    <option value="URGENT">Acil</option>
                                </select>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded-lg"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 py-2 rounded-lg">İptal</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
