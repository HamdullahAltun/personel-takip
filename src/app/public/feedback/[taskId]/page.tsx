"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

export default function PublicFeedbackPage() {
    const params = useParams();
    const taskId = params.taskId as string;

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Lütfen bir puan verin.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/public/feedback', {
                method: 'POST',
                body: JSON.stringify({ taskId, rating, comment }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                toast.error("Bir sorun oluştu.");
            }
        } catch (e) {
            toast.error("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Teşekkürler!</h1>
                    <p className="text-slate-500">Geri bildiriminiz bizim için çok değerli.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Hizmet Değerlendirmesi</h1>
                    <p className="text-slate-500 text-sm mt-1">Lütfen personelimizden aldığınız hizmeti puanlayın.</p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-2 transition active:scale-95 ${rating >= star ? 'text-orange-400' : 'text-slate-200'}`}
                        >
                            <Star className="h-10 w-10 fill-current" />
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Eklemek istedikleriniz... (Opsiyonel)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            "Gönderiliyor..."
                        ) : (
                            <>
                                <Send className="h-5 w-5" /> Değerlendirmeyi Gönder
                            </>
                        )}
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-300 mt-6">
                    Personel Yönetim Sistemi • Güvenli Geri Bildirim
                </p>
            </div>
        </div>
    );
}
