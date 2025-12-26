"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Loader2, Sparkles, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    role: 'user' | 'model';
    parts: string;
};

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: "Merhaba! Ben kişisel asistanınızım. Size görevleriniz, mesai saatleriniz veya genel konularda nasıl yardımcı olabilirim? 🤖" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', parts: userMsg }]);
        setLoading(true);

        try {
            // Transform history for Gemini: 'user' -> 'user', 'model' -> 'model'
            // Exclude the last added message (prompt) AND the initial welcome message if it's there
            // Gemini history must be User -> Model -> User ...
            const history = messages
                .filter((_, index) => index !== 0) // Remove initial fake welcome message
                .map(m => ({
                    role: m.role,
                    parts: [{ text: m.parts }]
                }));

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message: userMsg, history }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'model', parts: data.response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', parts: "Bağlantı hatası oluştu. Lütfen tekrar deneyin." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <AnimatePresence>
                {!isOpen && (
                    {!isOpen && (
                <motion.a
                    href="https://gemini.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95 group flex items-center justify-center"
                >
                    <Bot className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </motion.a>
                )}
                )}
            </AnimatePresence>

            {/* Chat Window */}

        </>
    );
}
