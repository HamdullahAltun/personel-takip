"use client";

import { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Heart, Coffee, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';

interface MoodStats {
    stats: Record<string, number>;
    percentages: Record<string, number>;
    total: number;
}

export default function TeamMood() {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<MoodStats | null>(null);

    const moods = [
        { id: 'happy', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Harika' },
        { id: 'neutral', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Normal' },
        { id: 'sad', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Yorgun' },
        { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Motive' },
        { id: 'coffee', icon: Coffee, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Kahve Lazım' },
    ];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/staff/mood');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSelectMood = async (id: string) => {
        setSelectedMood(id);
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // ignore
        }
    };

    const handleSubmit = async () => {
        if (!selectedMood) return;
        setLoading(true);
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });

            const res = await fetch('/api/staff/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mood: selectedMood })
            });

            if (res.ok) {
                setSubmitted(true);
                toast.success('Mood paylaşıldı!');
                fetchStats();
            } else {
                toast.error('Bir hata oluştu.');
            }
        } catch (e) {
            toast.error('Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    const getDominantMood = () => {
        if (!stats || stats.total === 0) return null;
        let max = 0;
        let dominant = ''; // id
        Object.entries(stats.percentages).forEach(([key, val]) => {
            if (val > max) {
                max = val;
                dominant = key;
            }
        });
        return dominant;
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full overflow-hidden relative">
            <AnimatePresence mode="wait">
                {submitted ? (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="py-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <Smile className="h-8 w-8 text-emerald-600" />
                        </motion.div>
                        <p className="text-sm font-bold text-slate-800">Harika! Paylaşıldı.</p>
                        <p className="text-xs text-slate-500 mt-1">
                            {stats && stats.total > 0 ? `Bugün ${stats.total} kişi mood paylaştı.` : 'İlk paylaşan sen oldun!'}
                        </p>

                        {stats && (
                            <div className="mt-6 flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
                                {Object.entries(stats.percentages).map(([key, val]) => {
                                    if (val === 0) return null;
                                    let color = 'bg-slate-300';
                                    if (key === 'happy') color = 'bg-emerald-500';
                                    if (key === 'neutral') color = 'bg-amber-400';
                                    if (key === 'sad') color = 'bg-rose-400';
                                    if (key === 'love') color = 'bg-pink-400';
                                    if (key === 'coffee') color = 'bg-indigo-400';

                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${val}%` }}
                                            transition={{ delay: 0.2, duration: 1 }}
                                            className={color}
                                            title={`${key}: %${val}`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1">Nasıl Hissediyorsun?</h2>
                        <p className="text-slate-400 text-[10px] font-medium mb-6">Modunu ekiple paylaş, enerjini yansıt!</p>

                        <div className="grid grid-cols-5 gap-2">
                            {moods.map((mood) => (
                                <motion.button
                                    key={mood.id}
                                    whileHover={{ scale: 1.1, y: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleSelectMood(mood.id)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-colors duration-300 group
                                        ${selectedMood === mood.id ? mood.bg + ' ring-2 ring-offset-2 ring-slate-100' : 'hover:bg-slate-50'}`}
                                >
                                    <mood.icon className={`h-6 w-6 transition-transform duration-300 ${selectedMood === mood.id ? mood.color + ' scale-110' : 'text-slate-400'}`} />
                                    <span className={`text-[8px] font-bold uppercase ${selectedMood === mood.id ? mood.color : 'text-slate-400'}`}>
                                        {mood.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: selectedMood ? 1 : 0.5, y: 0 }}
                            whileHover={selectedMood ? { scale: 1.02 } : {}}
                            whileTap={selectedMood ? { scale: 0.95 } : {}}
                            onClick={handleSubmit}
                            disabled={!selectedMood || loading}
                            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                {loading ? "Gönderiliyor..." : "Gönder"}
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
