"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check initial state
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-900 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2">
            <WifiOff className="h-4 w-4 text-red-400" />
            <span>İnternet bağlantısı koptu. Veriler kaydedilmeyebilir.</span>
        </div>
    );
}
