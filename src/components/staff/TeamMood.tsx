"use client";

import { useState } from 'react';
import { Smile, Frown, Meh, Heart, Coffee, Send } from 'lucide-react';

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

    const handleSubmit = () => {
        if (!selectedMood) return;
        setSubmitted(true);
        // In a real app, this would hit an API
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full">
            <div>
                <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-1">Nasıl Hissediyorsun?</h2>
                <p className="text-slate-400 text-[10px] font-medium mb-6">Modunu ekiple paylaş, enerjini yansıt!</p>

                {submitted ? (
                    <div className="py-8 text-center animate-in zoom-in duration-300">
                        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Smile className="h-8 w-8 text-emerald-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-800">Harika! Paylaşıldı.</p>
                        <p className="text-xs text-slate-500 mt-1">Ekip arkadaşlarının %80'i bugün mutlu hissediyor.</p>

                        <div className="mt-6 flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100">
                            <div className="bg-emerald-500 w-[80%]" />
                            <div className="bg-amber-400 w-[15%]" />
                            <div className="bg-rose-400 w-[5%]" />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {moods.map((mood) => (
                            <button
                                key={mood.id}
                                onClick={() => setSelectedMood(mood.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 group
                                    ${selectedMood === mood.id ? mood.bg + ' ring-2 ring-offset-2 ring-slate-100' : 'hover:bg-slate-50'}`}
                            >
                                <mood.icon className={`h-6 w-6 transition-transform duration-300 ${selectedMood === mood.id ? mood.color + ' scale-110' : 'text-slate-400 group-hover:scale-110'}`} />
                                <span className={`text-[8px] font-bold uppercase ${selectedMood === mood.id ? mood.color : 'text-slate-400'}`}>
                                    {mood.label}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={!selectedMood}
                    className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Send className="h-3 w-3" />
                        Gönder
                    </div>
                </button>
            )}
        </div>
    );
}
