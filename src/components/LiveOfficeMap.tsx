"use client";

import { useEffect, useState } from "react";
import { MapPin, User, Clock } from "lucide-react";
import { format } from "date-fns";

export default function LiveOfficeMap() {
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/live-status');
            if (res.ok) {
                setActiveUsers(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Canlı Ofis Durumu
                    </h2>
                    <p className="text-xs text-slate-500">Şu an ofiste olan personeller</p>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                    {activeUsers.length} <span className="text-sm font-normal text-slate-500">Kişi</span>
                </div>
            </div>

            <div className="p-6 relative">
                {/* Mock Office Layout Background */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-white to-white" />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48 text-slate-400">Yükleniyor...</div>
                ) : activeUsers.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-48 text-slate-400 text-center">
                        <MapPin className="h-10 w-10 mb-2 opacity-20" />
                        <p>Şu an ofiste kimse görünmüyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {activeUsers.map(u => (
                            <div key={u.id} className="flex flex-col items-center group relative p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-default">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                                        {u.profilePicture ? (
                                            <img src={u.profilePicture} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-8 w-8 text-indigo-400" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <h3 className="font-bold text-sm text-slate-900 mt-2 text-center leading-tight">{u.name}</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-semibold">{u.role}</p>
                                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(u.checkInTime), 'HH:mm')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
