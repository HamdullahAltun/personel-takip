"use client";

import { useState } from 'react';
import { Smile, Frown, Meh, Heart, Coffee, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function TeamMood() {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const moods = [
        { id: 'happy', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Harika' },
        { id: 'neutral', icon: Meh, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Normal' },
        { id: 'sad', icon: Frown, color: 'text-rose-500', bg: 'bg-rose-50', label: 'Yorgun' },
        { id: 'love', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Motive' },
        { id: 'coffee', icon: Coffee, color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'Kahve Lazım' },
    ];

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
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            // ignore
        }
        setSubmitted(true);
        // In a real app, this would hit an API
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
                        <p className="text-xs text-slate-500 mt-1">Ekip arkadaşlarının %80'i bugün mutlu hissediyor.</p>

                        <div className="mt-6 flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "80%" }}
                                transition={{ delay: 0.2, duration: 1 }}
                                className="bg-emerald-500"
                            />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "15%" }}
                                transition={{ delay: 0.3, duration: 1 }}
                                className="bg-amber-400"
                            />
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "5%" }}
                                transition={{ delay: 0.4, duration: 1 }}
                                className="bg-rose-400"
                            />
                        </div>
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
                            disabled={!selectedMood}
                            className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Send className="h-3 w-3" />
                                Gönder
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
