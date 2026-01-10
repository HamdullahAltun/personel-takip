"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none"
                >
                    <div className="bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-full text-xs font-bold flex items-center gap-3 shadow-2xl border border-white/10 pointer-events-auto">
                        <div className="bg-red-500/20 p-1.5 rounded-full">
                            <WifiOff className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        <span>İnternet bağlantısı koptu</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
