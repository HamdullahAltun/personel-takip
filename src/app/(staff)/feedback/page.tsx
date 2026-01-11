"use client";

import { useState } from "react";
import { MessageSquare, Send, Shield, AlertTriangle, Lightbulb, Heart } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackPage() {
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("SUGGESTION");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/staff/feedback', {
                method: 'POST',
                body: JSON.stringify({ content, category }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success("Geri bildiriminiz iletildi. Teşekkürler!");
                setContent("");
                setCategory("SUGGESTION");
            } else {
                toast.error("Bir hata oluştu.");
            }
        } catch (e) {
            toast.error("İletişim hatası.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-24 space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Anonim Kutu</h1>
                    <p className="text-slate-500 text-xs">Kimliğin gizli kalır. Rahatça paylaş.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4">Ne hakkında konuşmak istersin?</h3>

                <div className="flex overflow-x-auto gap-3 pb-2 mb-4 custom-scrollbar">
                    {[
                        { id: 'SUGGESTION', label: 'Öneri', icon: Lightbulb, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                        { id: 'COMPLAINT', label: 'Şikayet', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        { id: 'HR', label: 'İK Konusu', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setCategory(t.id)}
                            className={`flex flex-col items-center p-3 rounded-xl border min-w-[90px] transition-all
                                ${category === t.id
                                    ? `border-indigo-600 ring-1 ring-indigo-600 ${t.bg}`
                                    : 'border-slate-100 hover:bg-slate-50'}
                            `}
                        >
                            <t.icon className={`h-6 w-6 mb-2 ${t.color}`} />
                            <span className="text-xs font-bold text-slate-600">{t.label}</span>
                        </button>
                    ))}
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Düşüncelerini buraya yaz..."
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Bu mesaj tamamen anonim olarak iletilecektir.
                    </p>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'İletiliyor...' : (
                            <>
                                Gönder <Send className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
