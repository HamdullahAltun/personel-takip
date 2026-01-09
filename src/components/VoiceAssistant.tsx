"use client";

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface WebkitSpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    onstart: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onspeechend: () => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    start: () => void;
    stop: () => void;
}

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Mic, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "./VoiceVisualizer";

/**
 * Advanced Voice Assistant for PWA
 * Supports: Check-in, What is my next task?
 */
export default function VoiceAssistant() {
    const router = useRouter();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [browserSupport, setBrowserSupport] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) {
            // Use requestAnimationFrame to avoid synchronous setState in effect
            requestAnimationFrame(() => setBrowserSupport(false));
        }
    }, []);

    const handleVoiceCommand = useCallback(async (command: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/voice-command', {
                method: 'POST',
                body: JSON.stringify({ command }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            setResponse(data.message);

            // Speak response back
            const utterance = new SpeechSynthesisUtterance(data.message);
            utterance.lang = 'tr-TR';
            window.speechSynthesis.speak(utterance);

            // Trigger action if needed
            if (data.action === 'CHECK_IN_OUT') {
                // You can emit an event or call a function to refresh UI
                window.dispatchEvent(new CustomEvent('attendanceUpdate'));
                router.push('/scan');
            }
        } catch {
            const errorMsg = "Bağlantı hatası, lütfen tekrar deneyin.";
            setResponse(errorMsg);
            const utterance = new SpeechSynthesisUtterance(errorMsg);
            utterance.lang = 'tr-TR';
            window.speechSynthesis.speak(utterance);
        }
        setLoading(false);
    }, []);

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        const WebkitSpeechRecognition = (window as unknown as { webkitSpeechRecognition: new () => WebkitSpeechRecognition }).webkitSpeechRecognition;
        if (!WebkitSpeechRecognition) return;

        const recognition = new WebkitSpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript;
            setTranscript(command);
            handleVoiceCommand(command);
        };
        recognition.onspeechend = () => {
            recognition.stop();
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);

        recognition.start();
    };

    if (!browserSupport) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Transcript/Response Bubble */}
            {(transcript || response || loading) && (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-indigo-100 max-w-[250px] animate-in slide-in-from-bottom-5 pointer-events-auto">
                    <div className="flex flex-col gap-2">
                        {transcript && (
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Duyulan:</div>
                        )}
                        <p className="text-sm font-medium text-slate-700 italic">&quot;{transcript || "Dinliyorum..."}&quot;</p>

                        {(response || loading) && (
                            <div className="pt-2 border-t border-slate-50 mt-1">
                                {loading ? (
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                                        <Loader2 className="h-3 w-3 animate-spin" /> İşleniyor...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                                        <CheckCircle2 className="h-4 w-4" /> {response}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mic Button */}
            <button
                onClick={toggleListening}
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 pointer-events-auto relative overflow-hidden",
                    isListening
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 scale-110 shadow-rose-200"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200 hover:-translate-y-1"
                )}
            >
                {isListening ? (
                    <>
                        <VoiceVisualizer isListening={isListening} />

                    </>
                ) : (
                    <Mic className="text-white h-7 w-7" />
                )}

                {isListening && (
                    <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping pointer-events-none" />
                )}
            </button>
        </div>
    );
}
