"use client";

import { useState } from "react";
import { Award, Image as ImageIcon, Send, Loader2, MoreHorizontal, Wand2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreatePostProps {
    onPostCreated: () => void;
    users?: { id: string; name: string }[]; // For kudos
}

export default function CreatePost({ onPostCreated, users = [] }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [mode, setMode] = useState<'STANDARD' | 'KUDOS' | 'POLL'>('STANDARD');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [showImageInput, setShowImageInput] = useState(false);

    // AI State
    const [aiLoading, setAiLoading] = useState(false);

    // Kudos state
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [kudosCategory, setKudosCategory] = useState<string>("TEAMWORK");

    // Poll State
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

    const categories = [
        { id: 'TEAMWORK', label: 'Takım Çalışması', icon: '🤝' },
        { id: 'LEADERSHIP', label: 'Liderlik', icon: '🦁' },
        { id: 'INNOVATION', label: 'İnovasyon', icon: '💡' },
        { id: 'SPEED', label: 'Hız', icon: '⚡' },
    ];

    const handleSubmit = async () => {
        if (!content.trim() && mode === 'STANDARD') return;
        if (mode === 'KUDOS' && (!selectedUserId || !content.trim())) {
            toast.error("Lütfen bir kişi seçin ve mesaj yazın");
            return;
        }
        if (mode === 'POLL' && (!content.trim() || pollOptions.filter(o => o.trim()).length < 2)) {
            toast.error("Anket sorusu ve en az 2 seçenek gerekli");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    imageUrl,
                    type: mode,
                    kudosTargetId: mode === 'KUDOS' ? selectedUserId : undefined,
                    kudosCategory: mode === 'KUDOS' ? kudosCategory : undefined,
                    pollOptions: mode === 'POLL' ? pollOptions.filter(o => o.trim()) : undefined
                })
            });

            if (res.ok) {
                toast.success("Paylaşıldı!");

                // Confetti for Kudos
                if (mode === 'KUDOS') {
                    import('canvas-confetti').then(confetti => {
                        confetti.default({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#EAB308', '#CA8A04', '#FDE047']
                        });
                    });
                }

                // Reset
                setContent("");
                setMode('STANDARD');
                setSelectedUserId("");
                setImageUrl("");
                setShowImageInput(false);
                setPollOptions(["", ""]);
                onPostCreated();
            } else {
                toast.error("Hata oluştu");
            }
        } catch (e) {
            toast.error("Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    const handleAiGenerate = async () => {
        setAiLoading(true);
        try {
            if (mode === 'POLL') {
                if (!content.trim()) {
                    toast.error("Önce anket konusu yazın!");
                    return;
                }
                const res = await fetch('/api/ai/social', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'GENERATE_POLL', prompt: content }),
                });
                const data = await res.json();
                if (data.options) setPollOptions(data.options);
            } else {
                const prompt = content || "Write a positive work update";
                const type = mode === 'KUDOS' ? 'APPRECIATION' : 'PROFESSIONAL';

                const res = await fetch('/api/ai/social', {
                    method: 'POST',
                    body: JSON.stringify({ action: 'GENERATE_POST', prompt, type }),
                });
                const data = await res.json();
                if (data.content) setContent(data.content);
            }
        } catch (e) {
            console.error(e);
            toast.error("AI hatası");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden transition-all duration-300">
            {/* Mode Switcher */}
            <div className="flex gap-2 mb-4 bg-slate-50 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
                <button
                    onClick={() => setMode('STANDARD')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                        mode === 'STANDARD' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Gönderi
                </button>
                <button
                    onClick={() => setMode('KUDOS')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                        mode === 'KUDOS' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <Award className="h-4 w-4" />
                    Takdir Et
                </button>
                <button
                    onClick={() => setMode('POLL')}
                    className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                        mode === 'POLL' ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    Anket
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mode === 'KUDOS' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-4 space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100"
                    >
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        >
                            <option value="">Kimi takdir etmek istersin?</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setKudosCategory(cat.id)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center gap-2",
                                        kudosCategory === cat.id
                                            ? "bg-amber-100 border-amber-300 text-amber-800"
                                            : "bg-white border-amber-100 text-slate-500 hover:border-amber-300"
                                    )}
                                >
                                    <span>{cat.icon}</span> {cat.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {mode === 'POLL' && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-4 space-y-3 bg-purple-50/50 p-4 rounded-2xl border border-purple-100"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-purple-800">Seçenekler</label>
                            <button
                                onClick={handleAiGenerate}
                                disabled={aiLoading}
                                className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200"
                            >
                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                AI ile Üret
                            </button>
                        </div>
                        {pollOptions.map((opt, idx) => (
                            <input
                                key={idx}
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...pollOptions];
                                    newOpts[idx] = e.target.value;
                                    setPollOptions(newOpts);
                                }}
                                placeholder={`Seçenek ${idx + 1}`}
                                className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        ))}
                        {pollOptions.length < 5 && (
                            <button
                                onClick={() => setPollOptions([...pollOptions, ""])}
                                className="text-xs font-bold text-purple-600 hover:underline pl-1"
                            >
                                + Seçenek Ekle
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                        mode === 'KUDOS' ? "Neden takdir ettiğini yaz..." :
                            mode === 'POLL' ? "Anket sorusu nedir?" :
                                "Neler oluyor? Ekiple paylaş..."
                    }
                    className="w-full h-24 bg-transparent resize-none focus:outline-none text-slate-700 placeholder:text-slate-400 text-sm p-1"
                />

                {mode !== 'POLL' && (
                    <button
                        onClick={handleAiGenerate}
                        disabled={aiLoading}
                        className="absolute bottom-2 right-2 p-1.5 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-all"
                        title="AI ile Yaz"
                    >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    </button>
                )}
            </div>

            {mode === 'STANDARD' && showImageInput && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                    <input
                        className="w-full border border-slate-200 bg-slate-50 p-2 rounded-xl text-xs focus:outline-none"
                        placeholder="Resim URL'si (https://...)"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                    />
                </motion.div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    {mode === 'STANDARD' && (
                        <button
                            onClick={() => setShowImageInput(!showImageInput)}
                            className={cn("p-2 rounded-full transition-colors", showImageInput ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-400")}
                            title="Resim Ekle"
                        >
                            <ImageIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && mode !== 'POLL') || loading}
                    className={cn(
                        "text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                        mode === 'KUDOS' ? "bg-amber-500 shadow-amber-200" :
                            mode === 'POLL' ? "bg-purple-600 shadow-purple-200" :
                                "bg-slate-900 shadow-slate-200"
                    )}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                        mode === 'KUDOS' ? <Trophy className="h-4 w-4" /> :
                            <Send className="h-4 w-4" />
                    }
                    {mode === 'KUDOS' ? 'Takdir Et' : mode === 'POLL' ? 'Anket Başlat' : 'Paylaş'}
                </button>
            </div>
        </div>
    );
}
