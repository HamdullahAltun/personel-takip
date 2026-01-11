"use client";

import { useState, useEffect } from "react";
import { Bell, Trash2, CheckCircle, Info, Calendar, ChevronRight, Filter, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import useSWR from 'swr';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function StaffNotificationsPage() {
    const { data, mutate, isLoading } = useSWR('/api/notifications', fetcher);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

    const notifications = data?.notifications || [];
    const displayedNotifications = filter === 'ALL'
        ? notifications
        : notifications.filter((n: any) => !n.read);

    const markAsRead = async (id: string, currentRead: boolean) => {
        if (currentRead) return;
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ id })
            });
            mutate();
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ type: 'all' })
            });
            mutate();
            toast.success("Tüm bildirimler okundu olarak işaretlendi");
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const clearAll = async () => {
        if (!confirm("Tüm bildirimleri silmek istediğinize emin misiniz?")) return;
        try {
            await fetch('/api/notifications', { method: 'DELETE' });
            mutate();
            toast.success("Tüm bildirimler silindi");
        } catch (error) {
            toast.error("İşlem başarısız");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'SUCCESS': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case 'WARNING': return <AlertCircle className="h-5 w-5 text-amber-500" />;
            case 'ERROR': return <AlertCircle className="h-5 w-5 text-rose-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bildirimler</h1>
                        <p className="text-xs text-slate-500">Önemli güncellemeler ve duyurular</p>
                    </div>
                </div>
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center justify-between gap-4 mb-4 px-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                            filter === 'ALL' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setFilter('UNREAD')}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                            filter === 'UNREAD' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Okunmamış
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={markAllAsRead}
                        className="p-2 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                        title="Tümünü Okundu İşaretle"
                    >
                        <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                        onClick={clearAll}
                        className="p-2 bg-white text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-50 transition-colors shadow-sm"
                        title="Tümünü Sil"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 px-2">
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100" />
                    ))
                ) : displayedNotifications.length > 0 ? (
                    displayedNotifications.map((n: any) => (
                        <div
                            key={n.id}
                            onClick={() => markAsRead(n.id, n.read)}
                            className={cn(
                                "group bg-white p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden",
                                n.read
                                    ? "border-slate-100 grayscale-[0.5] opacity-80"
                                    : "border-indigo-100 shadow-lg shadow-indigo-50/50"
                            )}
                        >
                            {!n.read && (
                                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-indigo-500" />
                            )}

                            <div className="flex gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                                    n.type === 'SUCCESS' ? 'bg-emerald-50 border-emerald-100' :
                                        n.type === 'WARNING' ? 'bg-amber-50 border-amber-100' :
                                            n.type === 'ERROR' ? 'bg-rose-50 border-rose-100' :
                                                'bg-blue-50 border-blue-100'
                                )}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={cn(
                                            "text-sm font-black truncate",
                                            !n.read ? "text-slate-900" : "text-slate-600"
                                        )}>
                                            {n.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(n.createdAt), 'HH:mm', { locale: tr })}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {n.message}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(n.createdAt), 'd MMMM yyyy', { locale: tr })}
                                        </div>
                                        {!n.read && (
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                YENİ
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center self-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 opacity-50">
                        <Bell className="h-16 w-16 text-slate-200 mb-4" />
                        <h3 className="font-bold text-slate-400">Bildirim bulunamadı</h3>
                        <p className="text-xs text-slate-400">Her şey güncel görünüyor!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
