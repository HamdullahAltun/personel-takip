"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, CheckCircle2, Clock, Calendar, AlertCircle, Camera } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function StaffFieldTasks() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const res = await fetch("/api/field-tasks");
        if (res.ok) setTasks(await res.json());
        setLoading(false);
    };

    const handleAction = async (taskId: string, status: string) => {
        // Enforce GPS for Check-ins
        let checkInLat = null;
        let checkInLng = null;

        if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
            const pos: any = await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(resolve, () => resolve(null));
            });
            if (pos) {
                checkInLat = pos.coords.latitude;
                checkInLng = pos.coords.longitude;
            }
        }

        const res = await fetch("/api/field-tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, status, checkInLat, checkInLng })
        });

        if (res.ok) fetchTasks();
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-indigo-600 -m-4 p-8 text-white rounded-b-[3rem] shadow-lg mb-8">
                <h1 className="text-2xl font-bold">Saha Görevlerim</h1>
                <p className="text-indigo-100 text-sm">Dış mekan görevlerinizi buradan yönetin ve konum doğrulayın.</p>
            </div>

            <div className="space-y-4">
                {tasks.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                        <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Atanmış saha göreviniz bulunmuyor.</p>
                    </div>
                )}

                {tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 relative overflow-hidden group">
                        {task.status === 'COMPLETED' && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-bold">TAMAMLANDI</div>
                        )}

                        <div className="space-y-1">
                            <h3 className="font-bold text-lg text-slate-900">{task.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="w-4 h-4 text-indigo-500" />
                                {task.clientName}
                            </div>
                        </div>

                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl italic">
                            "{task.description || "Açıklama belirtilmemiş."}"
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <Navigation className="w-3 h-3" />
                                {task.location}
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                Atandı: {format(new Date(task.createdAt), "d MMMM yyyy HH:mm", { locale: tr })}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex gap-3">
                            {task.status === 'PENDING' && (
                                <button
                                    onClick={() => handleAction(task.id, 'IN_PROGRESS')}
                                    className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition"
                                >
                                    <Clock className="w-4 h-4" />
                                    Giriş Yap (Check-in)
                                </button>
                            )}
                            {task.status === 'IN_PROGRESS' && (
                                <button
                                    onClick={() => handleAction(task.id, 'COMPLETED')}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Görevi Bitir
                                </button>
                            )}
                            {task.status === 'COMPLETED' && (
                                <div className="w-full py-3 bg-slate-100 text-slate-400 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    İşlem Başarıyla Tamamlandı
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
