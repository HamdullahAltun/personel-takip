"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { Trophy, Medal, Star, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TopPerformers() {
    const { data: users = [], isLoading } = useSWR('/api/users', fetcher);
    const [showModal, setShowModal] = useState(false);

    // Sort users by points
    const sortedUsers = [...users].sort((a, b) => (b.points || 0) - (a.points || 0));
    const topUsers = sortedUsers.slice(0, 3);

    const colors = [
        "bg-amber-100 text-amber-600 border-amber-200",
        "bg-slate-100 text-slate-600 border-slate-200",
        "bg-orange-100 text-orange-600 border-orange-200"
    ];

    const icons = [
        <Trophy key="1" className="h-5 w-5" />,
        <Medal key="2" className="h-5 w-5" />,
        <Medal key="3" className="h-5 w-5" />
    ];

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                <div className="h-4 w-32 bg-slate-100 rounded-full mb-6 animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-24 bg-slate-100 rounded-full animate-pulse" />
                                <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Liderlik Tablosu
                    </h2>
                </div>

                <div className="space-y-4">
                    {topUsers.map((user, i) => (
                        <div key={user.id} className="flex items-center gap-4 group">
                            <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 ${colors[i] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {icons[i] || <Star className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase">{user.department?.name || 'Genel'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-900">{user.points || 0}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Puan</p>
                            </div>
                        </div>
                    ))}

                    {topUsers.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-xs italic">
                            Veri bulunamadı.
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="w-full mt-6 py-3 rounded-2xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors"
                >
                    Tüm Listeyi Gör
                </button>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[30px] w-full max-w-md h-[80vh] flex flex-col shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                                <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-amber-500" />
                                    Tüm Sıralama
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {sortedUsers.map((user, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={user.id}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors"
                                    >
                                        <div className="w-8 text-center font-black text-slate-300 text-sm">
                                            #{i + 1}
                                        </div>
                                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? colors[i] : 'bg-slate-100 text-slate-500'}`}>
                                            {i < 3 ? icons[i] : user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase">{user.department?.name || 'Genel'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900 tabular-nums">{user.points || 0}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Puan</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
