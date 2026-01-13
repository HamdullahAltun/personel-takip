"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle, Info, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from 'swr';
import { toast } from "sonner";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

import { socket } from "@/lib/socket";

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const { data, mutate } = useSWR('/api/notifications', fetcher, {
        refreshInterval: 30000 // Keep polling as backup
    });

    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = () => {
            mutate();
            toast.info("Yeni bildiriminiz var");
        };

        socket.on("notification", handleNewNotification);

        return () => {
            socket.off("notification", handleNewNotification);
        };
    }, [mutate]);

    const notifications: Notification[] = data?.notifications || [];
    const unreadCount = notifications.filter(n => !n.read).length;

    const toggleOpen = () => setIsOpen(!isOpen);

    const markAsRead = async (id: string, currentRead: boolean) => {
        if (currentRead) return;

        // Optimistic update locally? 
        // For simplicity, just api call and revalidate
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

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ type: 'all' })
            });
            mutate();
            toast.success("Tümü okundu olarak işaretlendi");
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const clearAll = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'DELETE'
            });
            mutate();
            toast.success("Bildirimler temizlendi");
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    return (
        <div className="relative z-40">
            <button
                onClick={toggleOpen}
                className="relative p-2 bg-slate-100/50 hover:bg-slate-200/50 rounded-full transition-colors text-slate-600 border border-slate-100"
            >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white text-slate-800">
                                <div>
                                    <h3 className="font-bold text-slate-900">Bildirimler</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{unreadCount} okunmamış</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                        title="Tümünü Okundu İşaretle"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                        title="Tümünü Temizle"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto bg-slate-50/30">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => markAsRead(notification.id, notification.read)}
                                                className={cn(
                                                    "p-4 hover:bg-white transition-all cursor-pointer relative group",
                                                    !notification.read ? "bg-indigo-50/40" : "bg-white/50"
                                                )}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-110",
                                                        notification.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                            notification.type === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                                notification.type === 'ERROR' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                                    'bg-blue-50 border-blue-100 text-blue-600'
                                                    )}>
                                                        {notification.type === 'SUCCESS' ? <CheckCircle className="h-5 w-5" /> :
                                                            notification.type === 'WARNING' ? <Info className="h-5 w-5" /> :
                                                                <Bell className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start w-full gap-2 mb-0.5">
                                                            <h4 className={cn("text-sm font-black text-slate-900 truncate", !notification.read && "text-indigo-950")}>
                                                                {notification.title}
                                                            </h4>
                                                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                {Math.floor((Date.now() - new Date(notification.createdAt).getTime()) / (1000 * 60))}dk
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-normal line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!notification.read && (
                                                    <span className="absolute top-4 right-2 h-2 w-2 bg-indigo-500 rounded-full ring-2 ring-white animate-pulse" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-slate-400">
                                        <div className="bg-slate-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                                            <Bell className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium">Yeni bildiriminiz yok</p>
                                        <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Harikasın!</p>
                                    </div>
                                )}
                            </div>

                            <a
                                href="/notifications"
                                className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-colors uppercase tracking-widest"
                                onClick={() => setIsOpen(false)}
                            >
                                Tümünü Gör
                            </a>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
