"use client";

import 'regenerator-runtime/runtime';
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { toast } from 'sonner';

export default function VoiceAssistant() {
    const [isClient, setIsClient] = useState(false);

    const commands = [
        {
            command: ['giriş yap', 'başlat'],
            callback: () => handleClockIn(),
            matchInterim: true
        },
        {
            command: ['çıkış yap', 'bitir'],
            callback: () => handleClockOut(),
            matchInterim: true
        },
        {
            command: ['yardım'],
            callback: () => toast.info("Komutlar: Giriş yap, Çıkış yap, Yardım"),
            matchInterim: true
        }
    ];

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition({ commands });

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleClockIn = async () => {
        toast.promise(fetch('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({ type: 'CHECK_IN', method: 'VOICE' }),
            headers: { 'Content-Type': 'application/json' }
        }), {
            loading: 'Giriş işlemi yapılıyor...',
            success: 'Sesli giriş başarılı!',
            error: 'Giriş yapılamadı.'
        });
        resetTranscript();
    };

    const handleClockOut = async () => {
        toast.promise(fetch('/api/attendance', {
            method: 'POST',
            body: JSON.stringify({ type: 'CHECK_OUT', method: 'VOICE' }),
            headers: { 'Content-Type': 'application/json' }
        }), {
            loading: 'Çıkış işlemi yapılıyor...',
            success: 'Sesli çıkış başarılı!',
            error: 'Çıkış yapılamadı.'
        });
        resetTranscript();
    };

    if (!isClient) return null;
    if (!browserSupportsSpeechRecognition) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-6 z-50">
            <button
                onClick={() => {
                    if (listening) {
                        SpeechRecognition.stopListening();
                    } else {
                        SpeechRecognition.startListening({ language: 'tr-TR', continuous: true });
                    }
                }}
                className={`p-4 rounded-full shadow-2xl transition-all active:scale-90 ${listening
                    ? 'bg-red-500 text-white animate-pulse shadow-red-200'
                    : 'bg-white text-slate-600 hover:text-indigo-600 border border-slate-100'
                    }`}
            >
                {listening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}

                {listening && transcript && (
                    <div className="absolute bottom-full mb-4 right-0 w-48 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-slate-100 shadow-xl text-xs font-medium text-slate-700 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Volume2 className="h-3 w-3 text-indigo-500" />
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Dinleniyor</span>
                        </div>
                        {transcript}
                    </div>
                )}
            </button>
        </div>
    );
}
