"use client";

import { useState, useEffect } from "react";
import { Gift, Coins, ShoppingBag, Loader2, Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    image?: string;
    stock: number;
}

interface User {
    id: string;
    name: string;
    points: number;
    profilePicture?: string;
    department?: { name: string };
}

export default function RewardsPage() {
    const [activeTab, setActiveTab] = useState<'SHOP' | 'LEADERBOARD'>('SHOP');
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [leaderboard, setLeaderboard] = useState<User[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rewardsRes, userRes, leaderboardRes] = await Promise.all([
                    fetch("/api/rewards"),
                    fetch("/api/auth/me"),
                    fetch("/api/users?sort=points&limit=10")
                ]);

                if (rewardsRes.ok) setRewards(await rewardsRes.json());
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData.user);
                }
                if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());

            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBuy = async (reward: Reward) => {
        if (!user || user.points < reward.cost) return;
        if (!confirm(`${reward.title} ürününü ${reward.cost} puana almak istediğinize emin misiniz?`)) return;

        setPurchasing(reward.id);
        try {
            const res = await fetch("/api/rewards/buy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rewardId: reward.id })
            });

            if (res.ok) {
                alert("Satın alma başarılı! Talep oluşturuldu.");
                setUser(prev => prev ? { ...prev, points: prev.points - reward.cost } : null);
            } else {
                const err = await res.json();
                alert(`Hata: ${err.error}`);
            }
        } catch (error) {
            console.error("Purchase error", error);
            alert("Bir hata oluştu.");
        } finally {
            setPurchasing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen pb-24 bg-slate-50">
            {/* Header */}
            <div className="bg-white p-6 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Gift className="w-6 h-6 text-indigo-600" />
                        Ödül & Sıralama
                    </h1>
                </div>

                {/* Points Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 mb-6">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Mevcut Puanın</p>
                    <div className="flex items-center gap-2">
                        <Coins className="w-8 h-8 text-yellow-400" />
                        <span className="text-4xl font-black">{user?.points || 0}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('SHOP')}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'SHOP' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Mağaza
                    </button>
                    <button
                        onClick={() => setActiveTab('LEADERBOARD')}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'LEADERBOARD' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Liderlik Tablosu
                    </button>
                </div>
            </div>

            {/* Shop Grid */}
            {activeTab === 'SHOP' && (
                <div className="p-6 grid grid-cols-2 gap-4">
                    {rewards.map(reward => {
                        const canAfford = (user?.points || 0) >= reward.cost;
                        const hasStock = reward.stock === -1 || reward.stock > 0;

                        return (
                            <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col h-full animate-in fade-in zoom-in duration-300">
                                <div className="aspect-square bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                                    {reward.image ? (
                                        <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag className="w-12 h-12" />
                                        </div>
                                    )}
                                    {!hasStock && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">STOK YOK</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-bold text-slate-900 mb-1">{reward.title}</h3>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2 flex-1">{reward.description}</p>

                                <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <div className="font-black text-indigo-600 flex items-center gap-1">
                                        <Coins className="w-4 h-4" />
                                        {reward.cost}
                                    </div>
                                    <button
                                        onClick={() => handleBuy(reward)}
                                        disabled={!canAfford || !hasStock || purchasing === reward.id}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${canAfford && hasStock
                                            ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            }`}
                                    >
                                        {purchasing === reward.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : hasStock ? (
                                            "Satın Al"
                                        ) : (
                                            "Tükendi"
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {rewards.length === 0 && (
                        <div className="col-span-2 text-center py-10 px-6">
                            <p className="text-slate-400 italic">Henüz indirimli ürün bulunmuyor.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard */}
            {activeTab === 'LEADERBOARD' && (
                <div className="p-6 space-y-4 animate-in slide-in-from-right duration-300">
                    {leaderboard.map((u, idx) => (
                        <div key={u.id} className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border",
                            idx === 0 ? "bg-amber-50 border-amber-100" :
                                idx === 1 ? "bg-slate-50 border-slate-200" :
                                    idx === 2 ? "bg-orange-50 border-orange-100" : "bg-white border-slate-100"
                        )}>
                            <div className="w-8 flex items-center justify-center font-black text-lg">
                                {idx === 0 ? <Crown className="w-6 h-6 text-amber-500" /> :
                                    idx === 1 ? <Medal className="w-6 h-6 text-slate-400" /> :
                                        idx === 2 ? <Medal className="w-6 h-6 text-orange-400" /> :
                                            <span className="text-slate-400">#{idx + 1}</span>
                                }
                            </div>

                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                {u.profilePicture ? (
                                    <img src={u.profilePicture} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                                        {u.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{u.name}</h3>
                                <p className="text-xs text-slate-500">{u.department?.name || 'Departman Yok'}</p>
                            </div>

                            <div className="text-right">
                                <div className="font-black text-indigo-600 text-lg">{u.points}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Puan</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
