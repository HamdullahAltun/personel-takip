"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Info, Award, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Mock notifications for now - in real app would come from API/Context
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'kudos', title: 'Yeni Kudos!', message: 'Ahmet sana "Harika iş!" dedi.', read: false, time: '2 dk önce' },
        { id: 2, type: 'goal', title: 'Hedef Tamamlandı', message: 'React Native öğrenme hedefini tamamladın.', read: false, time: '1 saat önce' },
        { id: 3, type: 'system', title: 'Sistem Bakımı', message: 'Bu gece 02:00\'de bakım yapılacak.', read: true, time: '5 saat önce' },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'kudos': return <Award className="w-4 h-4 text-orange-500" />;
            case 'goal': return <Check className="w-4 h-4 text-green-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 bg-white rounded-full hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm group"
            >
                <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60]"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 text-sm">Bildirimler</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                    >
                                        Tümünü Okundu İşaretle
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    Bildiriminiz yok.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((n) => (
                                        <div key={n.id} className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</h4>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{n.time}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
