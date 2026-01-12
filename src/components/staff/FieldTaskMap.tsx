"use client";

import { MapPin, Navigation, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

// Mock Data
const TASKS = [
    {
        id: 1,
        title: "Şube Denetimi",
        address: "Atatürk Cad. No:12, Merkez",
        status: "pending",
        time: "14:30",
        distance: "1.2 km"
    },
    {
        id: 2,
        title: "Müşteri Ziyareti - ABC Ltd.",
        address: "Organize Sanayi Bölgesi 3. Cadde",
        status: "in-progress",
        time: "16:00",
        distance: "5.4 km"
    },
    {
        id: 3,
        title: "Ekipman Teslimatı",
        address: "Yeni Mahalle, Lale Sokak No:5",
        status: "completed",
        time: "10:00",
        distance: "8.1 km"
    }
];

import { db } from "@/lib/db";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function FieldTaskMap() {
    const [selectedTask, setSelectedTask] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCheckIn = async (taskId: number) => {
        setLoading(true);
        try {
            // Get location
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const task = TASKS.find(t => t.id === taskId);
            if (!task) return;

            const checkInData = {
                tempId: uuidv4(),
                title: task.title,
                description: "Check-in performed",
                location: task.address,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                status: 'pending' as const,
                createdAt: new Date()
            };

            if (navigator.onLine) {
                // Try API directly
                // await fetch('/api/field-tasks/check-in', ...);
                toast.success("Check-in başarılı (Online)");
            } else {
                // Save to IndexedDB
                await db.fieldTasks.add(checkInData);
                toast.success("Check-in kaydedildi (Offline). İnternet gelince gönderilecek.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Konum alınamadı veya hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
            {/* Map Placeholder */}
            <div className="flex-1 bg-slate-200 rounded-3xl relative overflow-hidden group border border-slate-100 shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center opacity-50 pointer-events-none">
                    <span className="text-9xl text-slate-300 select-none font-black tracking-tighter">MAP</span>
                </div>

                {/* Mock Map Pins */}
                <div className="absolute top-1/4 left-1/3">
                    <button
                        onClick={() => setSelectedTask(1)}
                        className="bg-red-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform ring-4 ring-white/50"
                    >
                        <MapPin className="w-6 h-6" />
                    </button>
                </div>
                <div className="absolute top-1/2 right-1/4">
                    <button
                        onClick={() => setSelectedTask(2)}
                        className="bg-indigo-500 text-white p-2 rounded-full shadow-xl hover:scale-110 transition-transform ring-4 ring-white/50"
                    >
                        <MapPin className="w-6 h-6" />
                    </button>
                </div>

                {/* Floating GPS Button */}
                <button className="absolute bottom-4 right-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 text-slate-700 hover:text-indigo-600 transition-colors">
                    <Navigation className="w-6 h-6" />
                </button>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[40%]">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        Bugünün Saha Görevleri
                    </h3>
                </div>

                <div className="overflow-y-auto p-2 space-y-2">
                    {TASKS.map((task) => (
                        <div
                            key={task.id}
                            onClick={() => setSelectedTask(task.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${selectedTask === task.id
                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${task.status === 'completed' ? 'bg-green-100 text-green-600' :
                                task.status === 'in-progress' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-orange-100 text-orange-600'
                                }`}>
                                {task.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                    task.status === 'in-progress' ? <Navigation className="w-5 h-5" /> :
                                        <Clock className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-slate-900 truncate">{task.title}</h4>
                                <p className="text-xs text-slate-500 truncate">{task.address}</p>
                            </div>

                            {selectedTask === task.id && task.status !== 'completed' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckIn(task.id);
                                    }}
                                    disabled={loading}
                                    className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {loading ? '...' : 'Check-in'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
