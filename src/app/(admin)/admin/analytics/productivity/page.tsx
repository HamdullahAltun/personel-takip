"use client";

import { useState, useEffect } from "react";
import { Zap, Activity, Users, Star, TrendingUp, Calendar } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductivityData {
    heatmap: Array<{
        hour: string;
        [day: string]: number | string;
    }>;
    topPerformers: Array<{
        name: string;
        points: number;
        profilePicture: string | null;
        department?: { name: string };
    }>;
}

const Skeleton = () => (
    <div className="space-y-6 animate-pulse p-4">
        <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[400px] bg-slate-100 rounded-3xl"></div>
            <div className="h-[400px] bg-slate-100 rounded-3xl"></div>
        </div>
    </div>
);

export default function ProductivityPage() {
    const [data, setData] = useState<ProductivityData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics/productivity')
            .then(res => res.json())
            .then(val => {
                setData(val);
                setLoading(false);
            })
            .catch(err => {
                console.error("Productivity Fetch Error:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <Skeleton />;
    if (!data) return <div className="p-8 text-center text-slate-500">Veri bulunamadı.</div>;

    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];

    const getColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-slate-50 opacity-40';
            case 1: return 'bg-indigo-100';
            case 2: return 'bg-indigo-300';
            case 3: return 'bg-indigo-500 shadow-lg shadow-indigo-100';
            case 4: return 'bg-indigo-700 shadow-lg shadow-indigo-200';
            default: return 'bg-slate-50';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header section with glassmorphism flair */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-rose-600 rounded-2xl text-white shadow-xl shadow-orange-200 ring-4 ring-orange-50">
                        <Zap className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Üretkenlik Analizi</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            <p className="text-slate-500 text-sm font-medium">Haftalık takım performansı ve yoğunluk dağılımı</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md border border-slate-200/50 p-2 rounded-2xl shadow-sm">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 px-2">Son 7 Gün</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Heatmap Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-indigo-500" />
                            Vardiya Yoğunluğu
                        </h3>
                        <div className="flex gap-2">
                            {[0, 1, 2, 3, 4].map(l => (
                                <div key={l} className={`w-3 h-3 rounded-full ${getColor(l)}`} />
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto relative z-10">
                        <div className="min-w-[500px]">
                            <div className="flex mb-4">
                                <div className="w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saat</div>
                                {days.map(d => (
                                    <div key={d} className="flex-1 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {data.heatmap.map((row) => (
                                    <div key={row.hour} className="group flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                                        <div className="w-20 text-[11px] font-bold text-slate-400 text-right pr-4 tabular-nums">{row.hour}</div>
                                        {days.map(d => {
                                            const val = (row[d] as number) || 0;
                                            return (
                                                <motion.div
                                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                                    key={d}
                                                    className={`flex-1 h-10 rounded-xl transition-all ${getColor(val)} border-2 border-white/40 ring-1 ring-slate-100/50 cursor-help`}
                                                    title={`${row.hour} ${d}: Yoğunluk ${val}`}
                                                />
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Top Performers Section */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-indigo-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-900/40 text-white relative overflow-hidden"
                >
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                    
                    <h3 className="font-black text-white text-xl mb-8 flex items-center gap-3 relative z-10 border-b border-white/10 pb-4">
                        <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                        Haftanın Yıldızları
                    </h3>

                    <div className="space-y-6 relative z-10">
                        {data.topPerformers.map((user, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/5 transition-all group"
                            >
                                <div className="relative w-12 h-12 rounded-2xl bg-white/10 overflow-hidden shrink-0 ring-2 ring-white/10 transition-all group-hover:ring-white/30">
                                    {user.profilePicture ? (
                                        <Image 
                                            src={user.profilePicture} 
                                            alt={user.name}
                                            fill
                                            className="object-cover" 
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-black text-lg text-white/40">{user.name[0]}</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-white text-[15px] truncate tracking-tight">{user.name}</h4>
                                    <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-wider">{user.department?.name || 'Genel'}</p>
                                </div>
                                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                    <span className="font-black text-white text-sm tabular-nums">{user.points}</span>
                                    <span className="text-[9px] text-white/50 ml-1 font-black uppercase">P</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5 relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Motivasyon İpucu</span>
                        </div>
                        <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                            En çok puan toplayan personelimiz ayın sonunda özel bir ödüle hak kazanacaktır!
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
