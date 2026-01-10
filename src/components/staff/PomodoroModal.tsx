"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, Timer } from "lucide-react";

interface PomodoroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PomodoroModal({ isOpen, onClose }: PomodoroModalProps) {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Play notification sound here if desired
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        if (mode === 'work') setTimeLeft(25 * 60);
        else if (mode === 'short') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const changeMode = (newMode: 'work' | 'short' | 'long') => {
        setMode(newMode);
        setIsActive(false);
        if (newMode === 'work') setTimeLeft(25 * 60);
        else if (newMode === 'short') setTimeLeft(5 * 60);
        else setTimeLeft(15 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                    <X className="h-4 w-4 text-slate-500" />
                </button>

                <div className="flex items-center gap-2 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                        <Timer className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Odaklanma Modu</h3>
                        <p className="text-slate-500 text-xs">Pomodoro Tekniği</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
                    <button
                        onClick={() => changeMode('work')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'work' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Çalış (25)
                    </button>
                    <button
                        onClick={() => changeMode('short')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'short' ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Kısa (5)
                    </button>
                    <button
                        onClick={() => changeMode('long')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'long' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Uzun (15)
                    </button>
                </div>

                <div className="text-center mb-8">
                    <div className="text-7xl font-black text-slate-900 tabular-nums tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-slate-400 text-sm font-medium mt-2">
                        {isActive ? "Süre İşliyor..." : "Hazır mısın?"}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTimer}
                        className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95 ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        {isActive ? "Duraklat" : "Başlat"}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="aspect-square h-[56px] flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <RotateCcw className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
