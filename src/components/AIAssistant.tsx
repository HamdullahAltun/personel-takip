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

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Sunucu Hatası (${res.status}): ${errText.slice(0, 100)}`);
            }

            const data = await res.json();

            if (!data.response) {
                setMessages(prev => [...prev, { role: 'model', parts: "Cevap alınamadı. (Veri boş)" }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', parts: data.response }]);
            }
        } catch (error) {
            console.error(error);
            const errMsg = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
            setMessages(prev => [...prev, { role: 'model', parts: `Hata: ${errMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all active:scale-95 group"
                    >
                        <Bot className="h-8 w-8 group-hover:rotate-12 transition-transform" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className={cn(
                            "fixed z-50 bg-white shadow-2xl rounded-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300",
                            isExpanded
                                ? "inset-4 bottom-24 md:bottom-4 md:right-4 md:left-auto md:w-[600px] md:h-[600px]"
                                : "bottom-24 right-4 w-[calc(100vw-32px)] h-[500px] md:w-[400px]"
                        )}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">AI Asistan</h3>
                                    <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Çevrimiçi
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition hidden md:block"
                                >
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative" ref={scrollRef}>
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                        msg.role === 'user' ? "bg-slate-200" : "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                                    )}>
                                        {msg.role === 'user' ? <User className="h-4 w-4 text-slate-600" /> : <Sparkles className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm shadow-sm leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                    )}>
                                        {msg.parts}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shrink-0">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <form onSubmit={handleSend} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Bir şeyler sorun..."
                                    className="flex-1 bg-slate-100 hover:bg-slate-50 focus:bg-white border-transparent focus:border-indigo-500 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || loading}
                                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
