"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, HeartPulse, Send } from "lucide-react";
import { toast } from "sonner";

export default function EmergencyBanner() {
    const [isEmergency, setIsEmergency] = useState(false);
    const [message, setMessage] = useState("");
    const [myStatus, setMyStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkEmergency();
        const interval = setInterval(checkEmergency, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const checkEmergency = async () => {
        try {
            const res = await fetch('/api/admin/emergency/status'); // Need to create this
            if (res.ok) {
                const data = await res.json();
                setIsEmergency(data.isEmergencyMode);
                setMessage(data.emergencyMessage);
            }
        } catch (e) { }
    };

    const updateStatus = async (status: 'SAFE' | 'DANGER' | 'HELP_NEEDED') => {
        setLoading(true);
        try {
            // Try to get location
            let lat = null, lng = null;
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                });
            }

            const res = await fetch('/api/staff/safety-status', {
                method: 'POST',
                body: JSON.stringify({ status, lat, lng }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                setMyStatus(status);
                toast.success("Durumunuz güncellendi.");
                if (status === 'SAFE') setIsEmergency(false); // Hide for them once safe? Or let it stay.
            }
        } catch (e) {
            toast.error("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (!isEmergency) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 text-white p-4 shadow-2xl animate-bounce-subtle">
            <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white text-rose-600 p-2 rounded-full animate-pulse">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h2 className="font-black text-lg leading-tight tracking-tight">ACİL DURUM SİSTEMİ AKTİF</h2>
                        <p className="text-rose-100 text-xs font-bold">{message || "Lütfen durumunuzu bildirin!"}</p>
                    </div>
                </div>

                {!myStatus ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            disabled={loading}
                            onClick={() => updateStatus('SAFE')}
                            className="bg-white text-rose-600 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <ShieldCheck size={18} /> GÜVENDEYİM
                        </button>
                        <button
                            disabled={loading}
                            onClick={() => updateStatus('HELP_NEEDED')}
                            className="bg-rose-950 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 animate-pulse active:scale-95 transition-all"
                        >
                            <HeartPulse size={18} /> YARDIM LAZIM
                        </button>
                    </div>
                ) : (
                    <div className="bg-rose-700/50 p-3 rounded-xl border border-rose-500 flex items-center justify-between">
                        <p className="text-xs font-bold">Durumunuz: <span className="underline">{myStatus === 'SAFE' ? 'GÜVENDE' : 'YARDIM BEKLİYOR'}</span></p>
                        <button onClick={() => setMyStatus(null)} className="text-[10px] bg-white/20 px-2 py-1 rounded-lg">Değiştir</button>
                    </div>
                )}
            </div>
        </div>
    );
}
