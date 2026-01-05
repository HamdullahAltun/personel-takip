"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Navigation, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Task = {
    id: string;
    title: string;
    description: string;
    clientName: string;
    location: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    createdAt: string;
    checkInTime?: string;
    checkOutTime?: string;
};

export default function StaffFieldTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const res = await fetch("/api/field-tasks");
        if (res.ok) setTasks(await res.json());
        setLoading(false);
    };

    const handleStatusChange = async (task: Task, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
        setProcessingId(task.id);

        let locationData = {};

        // Capture GPS for Check-in
        if (newStatus === 'IN_PROGRESS') {
            try {
                const pos = await getCurrentPosition();
                locationData = {
                    checkInLat: pos.coords.latitude,
                    checkInLng: pos.coords.longitude
                };
            } catch (e) {
                alert("Konum alınamadı. Lütfen GPS izni verin.");
                setProcessingId(null);
                return;
            }
        }

        const res = await fetch("/api/field-tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                taskId: task.id,
                status: newStatus,
                ...locationData
            })
        });

        if (res.ok) {
            fetchTasks();
        } else {
            alert("İşlem başarısız.");
        }
        setProcessingId(null);
    };

    const getCurrentPosition = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) reject("Geolocation not supported");
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
    };

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Saha Görevlerim</h1>
                <p className="text-slate-500">Atanan dış görevler ve ziyaretler.</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Yükleniyor...</div>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
                            {/* Status Strip */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${task.status === 'COMPLETED' ? 'bg-green-500' :
                                    task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-amber-500'
                                }`} />

                            <div className="p-5 pl-7">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 text-lg">{task.clientName}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {task.status === 'PENDING' ? 'Bekliyor' :
                                            task.status === 'IN_PROGRESS' ? 'Sürüyor' : 'Tamamlandı'}
                                    </span>
                                </div>

                                <p className="text-slate-600 font-medium mb-1">{task.title}</p>
                                <p className="text-sm text-slate-400 mb-4">{task.description}</p>

                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 bg-slate-50 p-2 rounded-lg">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    <span>{task.location}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    {task.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleStatusChange(task, 'IN_PROGRESS')}
                                            disabled={processingId === task.id}
                                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {processingId === task.id ? 'Konum Alınıyor...' : (
                                                <>
                                                    <Navigation className="w-4 h-4" />
                                                    Görevi Başlat (Check-in)
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {task.status === 'IN_PROGRESS' && (
                                        <button
                                            onClick={() => handleStatusChange(task, 'COMPLETED')}
                                            disabled={processingId === task.id}
                                            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Görevi Tamamla
                                        </button>
                                    )}

                                    {task.status === 'COMPLETED' && (
                                        <div className="flex bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold w-full items-center justify-center gap-2 border border-green-100">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Tamamlandı
                                        </div>
                                    )}
                                </div>

                                {/* Timestamps */}
                                {(task.checkInTime || task.checkOutTime) && (
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs text-slate-400">
                                        {task.checkInTime && <span>Başlangıç: {format(new Date(task.checkInTime), "HH:mm")}</span>}
                                        {task.checkOutTime && <span>Bitiş: {format(new Date(task.checkOutTime), "HH:mm")}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {tasks.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                            <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500">Atanmış saha göreviniz yok.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
