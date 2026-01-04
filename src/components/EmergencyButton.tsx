"use client";

import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmergencyButton() {
    const [status, setStatus] = useState<'IDLE' | 'SAFE' | 'DANGER' | 'LOADING'>('IDLE');
    const [open, setOpen] = useState(false);

    const updateStatus = async (newStatus: 'SAFE' | 'DANGER') => {
        setStatus('LOADING');
        try {
            await fetch('/api/staff/safety', {
                method: 'POST',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            });
            setStatus(newStatus);
            setTimeout(() => {
                setOpen(false); // Close after success
                setStatus('IDLE'); // Reset state so they can update again if needed
            }, 2000);
        } catch (e) {
            alert("Durum güncellenemedi!");
            setStatus('IDLE');
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-24 right-4 z-40 bg-white/90 backdrop-blur border border-red-100 shadow-xl p-3 rounded-full text-red-600 hover:scale-110 transition-transform active:scale-90 md:bottom-8"
            >
                <ShieldAlert className="h-6 w-6 animate-pulse" />
            </button>

            {/* Full Screen Overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 space-y-12"
                    >
                        <h2 className="text-3xl font-black text-white text-center">ACİL DURUM KONTROLÜ</h2>

                        {status === 'LOADING' ? (
                            <Loader2 className="h-16 w-16 text-white animate-spin" />
                        ) : status === 'SAFE' ? (
                            <div className="flex flex-col items-center animate-in zoom-in">
                                <ShieldCheck className="h-24 w-24 text-green-500 mb-4" />
                                <p className="text-2xl font-bold text-green-500">Güvendesiniz!</p>
                                <p className="text-slate-400 mt-2">Durumunuz merkeze iletildi.</p>
                            </div>
                        ) : status === 'DANGER' ? (
                            <div className="flex flex-col items-center animate-in zoom-in">
                                <ShieldAlert className="h-24 w-24 text-red-500 mb-4" />
                                <p className="text-2xl font-bold text-red-500">Acil Durum Bildirildi!</p>
                                <p className="text-slate-400 mt-2">Ekiplere haber verildi. Konumunuz paylaşılıyor.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 w-full max-w-sm gap-6">
                                <button
                                    onClick={() => updateStatus('DANGER')}
                                    className="bg-red-600 text-white p-8 rounded-3xl font-black text-2xl flex flex-col items-center gap-4 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-red-500"
                                >
                                    <ShieldAlert className="h-16 w-16" />
                                    ACİL YARDIM
                                    <span className="text-xs font-medium opacity-70">Tehlikedeyim / Yardıma İhtiyacım Var</span>
                                </button>

                                <button
                                    onClick={() => updateStatus('SAFE')}
                                    className="bg-green-600 text-white p-6 rounded-3xl font-bold text-xl flex flex-col items-center gap-2 hover:bg-green-500 active:scale-95 transition"
                                >
                                    <ShieldCheck className="h-10 w-10" />
                                    GÜVENDEYİM
                                </button>
                            </div>
                        )}

                        <button onClick={() => setOpen(false)} className="text-slate-500 text-sm font-bold underline mt-8">
                            Pencereyi Kapat
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
