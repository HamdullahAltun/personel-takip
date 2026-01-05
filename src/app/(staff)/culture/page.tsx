"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Star, Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CulturePage() {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [eom, setEom] = useState<any>(null); // Employee of Month
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification/leaderboard')
            .then(res => res.json())
            .then(data => {
                setLeaderboard(data.leaderboard || []);
                setEom(data.employeeOfTheMonth);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="space-y-8 pb-20">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Trophy className="h-8 w-8 text-amber-500 fill-amber-500" />
                    Şeref Kürsüsü
                </h1>
                <p className="text-slate-500 font-medium">Bu ayın en yüksek performans gösteren yıldızları.</p>
            </div>

            {/* Employee of the Month Spotlight */}
            {eom && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white/30 shadow-xl overflow-hidden">
                                <img src={eom.user.profilePicture || `https://ui-avatars.com/api/?name=${eom.user.name}`} alt={eom.user.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -top-4 -right-4 bg-amber-400 text-amber-900 p-3 rounded-full shadow-lg animate-bounce">
                                <Crown className="h-6 w-6 fill-current" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="inline-block px-3 py-1 bg-white/20 rounded-lg text-xs font-bold uppercase tracking-widest mb-2">Ayın Personeli</div>
                            <h2 className="text-4xl font-black">{eom.user.name}</h2>
                            <p className="text-indigo-100 font-medium text-lg">{eom.user.department?.name || 'Genel'} Departmanı</p>
                            <p className="opacity-80 max-w-lg italic">"{eom.note || 'Üstün performansı ve özverisi için teşekkür ederiz.'}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12 min-h-[300px]">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="bg-white p-6 rounded-t-3xl rounded-b-xl shadow-lg border-b-4 border-slate-200 flex flex-col items-center justify-end h-[80%] order-2 md:order-1 relative group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute -top-6 w-12 h-12 bg-slate-300 rounded-full flex items-center justify-center font-black text-slate-600 shadow-lg z-10">2</div>
                        <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden border-2 border-slate-200">
                            <img src={topThree[1].profilePicture || `https://ui-avatars.com/api/?name=${topThree[1].name}`} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-center line-clamp-1">{topThree[1].name}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-3">{topThree[1].department?.name}</p>
                        <div className="text-2xl font-black text-slate-700 flex items-center gap-1">
                            <Star className="h-5 w-5 fill-current text-slate-400" />
                            {topThree[1].points}
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="bg-gradient-to-b from-amber-50 to-white p-6 rounded-t-[40px] rounded-b-xl shadow-xl border-b-4 border-amber-200 flex flex-col items-center justify-end h-full order-1 md:order-2 relative z-10 group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute -top-8 w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center font-black text-amber-900 text-2xl shadow-xl z-20">1</div>
                        <div className="w-24 h-24 rounded-full bg-amber-100 mb-4 overflow-hidden border-4 border-amber-300 shadow-inner">
                            <img src={topThree[0].profilePicture || `https://ui-avatars.com/api/?name=${topThree[0].name}`} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center line-clamp-1">{topThree[0].name}</h3>
                        <p className="text-sm text-amber-600 font-bold mb-4">{topThree[0].department?.name}</p>
                        <div className="text-4xl font-black text-amber-500 flex items-center gap-2">
                            <Trophy className="h-8 w-8 fill-current" />
                            {topThree[0].points}
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="bg-white p-6 rounded-t-3xl rounded-b-xl shadow-lg border-b-4 border-orange-200 flex flex-col items-center justify-end h-[70%] order-3 md:order-3 relative group hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute -top-6 w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center font-black text-orange-800 shadow-lg z-10">3</div>
                        <div className="w-20 h-20 rounded-full bg-orange-50 mb-4 overflow-hidden border-2 border-orange-200">
                            <img src={topThree[2].profilePicture || `https://ui-avatars.com/api/?name=${topThree[2].name}`} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-center line-clamp-1">{topThree[2].name}</h3>
                        <p className="text-xs text-slate-500 font-medium mb-3">{topThree[2].department?.name}</p>
                        <div className="text-2xl font-black text-orange-700 flex items-center gap-1">
                            <Star className="h-5 w-5 fill-current text-orange-400" />
                            {topThree[2].points}
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100 text-left">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest pl-8">Sıra</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Personel</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Departman</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right pr-8">Puan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rest.map((user, idx) => (
                                <tr key={user.id} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="p-4 pl-8 font-black text-slate-400">{idx + 4}</td>
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                                            <img src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.name}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="flex gap-1 mt-0.5">
                                                {user.achievements?.map((a: any, i: number) => (
                                                    <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Medal className="h-3 w-3" /> {a.title}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-500">{user.department?.name || '-'}</td>
                                    <td className="p-4 pr-8 text-right font-black text-indigo-600">{user.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
