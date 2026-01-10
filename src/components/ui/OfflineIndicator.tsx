"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        // Set initial state
        setIsOffline(!navigator.onLine);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-900 border-t border-slate-800 text-white z-50 fixed bottom-0 left-0 right-0 md:bottom-auto md:top-0 md:border-b md:border-t-0"
                >
                    <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <WifiOff className="h-4 w-4 text-red-400" />
                        <span>İnternet Bağlantısı Yok</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
