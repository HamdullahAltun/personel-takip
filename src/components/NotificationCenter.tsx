"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Info, Award, X, CheckCircle, Trash2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from 'swr';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { data, mutate } = useSWR('/api/notifications', fetcher, {
        refreshInterval: 30000
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const notifications = data?.notifications || [];
    const unreadCount = notifications.filter((n: any) => !n.read).length;

    const markAsRead = async (id: string, currentRead: boolean) => {
        if (currentRead) return;
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id })
            });
            mutate();
        } catch (error) {
            console.error(error);
        }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ type: 'all' })
            });
            mutate();
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'WARNING': return <Info className="w-4 h-4 text-amber-500" />;
            case 'ERROR': return <X className="w-4 h-4 text-rose-500" />;
            default: return <Info className="w-4 h-4 text-indigo-500" />;
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2.5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-slate-100 group"
            >
                <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-indigo-600 border-2 border-white rounded-full animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        className="absolute top-14 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[60]"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-black text-slate-900 text-sm italic tracking-tight uppercase">Bildirim Paneli</h3>
                                <p className="text-[10px] text-slate-500 font-bold">{unreadCount} Okunmamış</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors"
                                        title="Tümünü Okundu İşaretle"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 bg-slate-50/50">
                                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Hiç bildirim yok</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {notifications.map((n: any) => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id, n.read)}
                                            className={cn(
                                                "p-4 flex gap-4 hover:bg-slate-50 transition-all cursor-pointer relative",
                                                !n.read ? 'bg-indigo-50/30' : 'opacity-70'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                                n.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' :
                                                    n.type === 'WARNING' ? 'bg-amber-50 border-amber-100' :
                                                        'bg-indigo-50 border-indigo-100'
                                            )}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className={cn("text-xs font-black truncate", !n.read ? 'text-slate-900' : 'text-slate-600')}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">
                                                        {format(new Date(n.createdAt), 'HH:mm', { locale: tr })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                                            </div>
                                            {!n.read && (
                                                <div className="absolute top-4 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Otonom Bildirim Merkezi</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
