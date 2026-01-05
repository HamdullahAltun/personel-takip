"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VoiceCommand() {
    const [isListening, setIsListening] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;

        // @ts-ignore
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'tr-TR';

        recognition.onresult = (event: any) => {
            const command = event.results[0][0].transcript.toLowerCase();
            console.log("Sesli Komut:", command);
            processCommand(command);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        if (isListening) recognition.start();
        else recognition.stop();

        return () => recognition.stop();
    }, [isListening]);

    const processCommand = (cmd: string) => {
        if (cmd.includes("pano") || cmd.includes("dashboard") || cmd.includes("ana sayfa")) {
            router.push("/admin");
        } else if (cmd.includes("görev") || cmd.includes("task")) {
            router.push("/admin/tasks");
        } else if (cmd.includes("personel") || cmd.includes("çalışan")) {
            router.push("/admin/staff");
        } else if (cmd.includes("acil")) {
            router.push("/admin/emergency");
        } else {
            alert(`Komut anlaşılamadı: "${cmd}"`);
        }
    };

    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window)) return null;

    return (
        <button
            onClick={() => setIsListening(!isListening)}
            className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all z-50 ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        >
            {isListening ? <Mic className="h-6 w-6 text-white" /> : <MicOff className="h-6 w-6 text-white" />}
        </button>
    );
}
