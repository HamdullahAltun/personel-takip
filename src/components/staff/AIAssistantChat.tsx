"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export default function AIAssistantChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Merhaba! Ben Personel Asistanıyım. İzinleriniz, vardiyalarınız veya şirket politikaları hakkında bana sorular sorabilirsiniz.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const responses = [
                "Yıllık izninizden kalan 14 gününüz bulunmaktadır.",
                "Bir sonraki vardiyanız Pazartesi 09:00 - 18:00 arasındadır.",
                "Şirket içi eğitim kataloğuna 'Eğitim' sekmesinden ulaşabilirsiniz.",
                "Bunu henüz tam olarak anlayamadım, ancak İK departmanına iletebilirim.",
                "Maaş bordronuz her ayın 1'inde sistemde yayınlanır."
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: randomResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const suggestions = [
        "Kalan izin günlerim?",
        "Maaş bordrom nerede?",
        "Bugün yemekte ne var?",
        "Servis saatleri kaçta?"
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Bot className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-lg">AI Asistan</h2>
                    <p className="text-xs text-indigo-100 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Çevrimiçi
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100' : 'bg-white shadow-sm border border-slate-100'
                            }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                        </div>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                            }`}>
                            {msg.content}
                            <div className={`text-[9px] mt-1 opacity-60 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (Only if few messages) */}
            {messages.length < 3 && (
                <div className="px-4 py-2 bg-slate-50/50 flex gap-2 overflow-x-auto no-scrollbar">
                    {suggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => setInput(suggestion)}
                            className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 whitespace-nowrap transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Bir şeyler sorun..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-200"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
