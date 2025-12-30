"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Star, Gift, Ticket, Coffee, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Reward = {
    id: string;
    title: string;
    description: string;
    cost: number;
    stock: number;
    image: string;
};

export default function RewardShopPage() {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch User Points & Rewards
        Promise.all([
            fetch('/api/auth/me').then(r => r.json()),
            fetch('/api/rewards').then(r => r.json())
        ]).then(([userData, rewardsData]) => {
            if (userData.user) setPoints(userData.user.points || 0);
            if (Array.isArray(rewardsData)) setRewards(rewardsData);
            setLoading(false);
        });
    }, []);

    const handlePurchase = async (reward: Reward) => {
        if (!confirm(`${reward.title} ürününü ${reward.cost} puana almak istiyor musunuz?`)) return;

        try {
            const res = await fetch('/api/rewards/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rewardId: reward.id })
            });
            const data = await res.json();

            if (res.ok) {
                alert("Başarıyla talep edildi! Yöneticiniz onayladığında ödülünüzü alabilirsiniz.");
                setPoints(prev => prev - reward.cost);
                // Simple optimistic update for stock
                setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, stock: r.stock === -1 ? -1 : r.stock - 1 } : r));
            } else {
                alert(data.error);
            }
        } catch (e) {
            alert("Bir hata oluştu.");
        }
    };

    const getIcon = (img: string) => {
        switch (img) {
            case 'coffee': return <Coffee className="h-8 w-8 text-amber-700" />;
            case 'time': return <Clock className="h-8 w-8 text-blue-600" />;
            case 'ticket': return <Ticket className="h-8 w-8 text-red-500" />;
            default: return <Gift className="h-8 w-8 text-purple-600" />;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Wallet */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-purple-100 text-sm font-medium mb-1">Cüzdanım</p>
                    <h1 className="text-4xl font-bold flex items-center gap-2">
                        {points} <span className="text-lg font-normal opacity-80">Puan</span>
                    </h1>
                    <p className="text-xs text-purple-200 mt-2">Başarımlarınızdan ve devamlılığınızdan kazandığınız puanlar.</p>
                </div>
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Star className="h-32 w-32 rotate-12" />
                </div>
            </div>

            <div className="flex items-center gap-2 px-2">
                <ShoppingBag className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-bold text-slate-800">Ödül Mağazası</h2>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Yükleniyor...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {rewards.map(reward => (
                        <div key={reward.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col justify-between group hover:border-purple-200 transition-all">
                            <div>
                                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    {getIcon(reward.image || 'gift')}
                                </div>
                                <h3 className="font-bold text-slate-900 leading-tight">{reward.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reward.description}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="font-bold text-purple-600 text-sm">{reward.cost} P</span>
                                <button
                                    onClick={() => handlePurchase(reward)}
                                    disabled={points < reward.cost || (reward.stock !== -1 && reward.stock <= 0)}
                                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-600 transition-colors"
                                >
                                    Al
                                </button>
                            </div>
                        </div>
                    ))}
                    {rewards.length === 0 && (
                        <div className="col-span-2 text-center py-10 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500">
                            Mağaza şu an boş.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
