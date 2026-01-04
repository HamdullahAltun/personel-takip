"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, CheckCircle2, Clock, Calendar, User, Search, Map as MapIcon, Navigation } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

export default function FieldTasksAdmin() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        clientName: "",
        location: "",
        userId: ""
    });

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        const res = await fetch("/api/field-tasks");
        if (res.ok) setTasks(await res.json());
        setLoading(false);
    };

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/field-tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask)
        });
        if (res.ok) {
            setShowAddModal(false);
            fetchTasks();
            setNewTask({ title: "", description: "", clientName: "", location: "", userId: "" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Saha Görevleri (GPS Destekli)</h1>
                    <p className="text-slate-500">Personellerin dış görevlerini ve konum bazlı girişlerini takip edin.</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/field-tasks/live"
                        className="flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition shadow-sm font-medium"
                    >
                        <MapIcon className="w-4 h-4" />
                        Canlı Harita
                    </Link>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Görev Ata
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900">{task.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <User className="w-3 h-3" />
                                        {task.user?.name}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {task.status === 'PENDING' ? 'Bekliyor' :
                                        task.status === 'IN_PROGRESS' ? 'Süreçte' : 'Tamamlandı'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span>{task.clientName} - {task.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(task.createdAt), "d MMMM HH:mm", { locale: tr })}
                                </div>
                            </div>

                            {task.checkInTime && (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-slate-500">Giriş (Check-in):</span>
                                        <span className="font-medium text-slate-700">{format(new Date(task.checkInTime), "HH:mm")}</span>
                                    </div>
                                    {task.checkOutTime && (
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-slate-500">Çıkış (Check-out):</span>
                                            <span className="font-medium text-slate-700">{format(new Date(task.checkOutTime), "HH:mm")}</span>
                                        </div>
                                    )}
                                    {task.checkInLat && (
                                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium pt-1">
                                            <Navigation className="w-3 h-3" />
                                            GPS Doğrulandı
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Yeni Saha Görevi Ata</h2>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Görev Başlığı</label>
                                <input
                                    required
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel Seçin</label>
                                <select
                                    required
                                    value={newTask.userId}
                                    onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Müşteri/Durak</label>
                                    <input
                                        required
                                        type="text"
                                        value={newTask.clientName}
                                        onChange={(e) => setNewTask({ ...newTask, clientName: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Adres/Konum</label>
                                    <input
                                        required
                                        type="text"
                                        value={newTask.location}
                                        onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
