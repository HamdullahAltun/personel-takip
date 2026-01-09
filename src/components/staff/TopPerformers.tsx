"use client";

import useSWR from 'swr';
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TopPerformers() {
    const { data: users = [] } = useSWR('/api/users', fetcher);

    // Sort users by points (mocking points if not present or just using skillScore)
    const topUsers = [...users]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 3);

    const colors = [
        "bg-amber-100 text-amber-600 border-amber-200",
        "bg-slate-100 text-slate-600 border-slate-200",
        "bg-orange-100 text-orange-600 border-orange-200"
    ];

    const icons = [
        <Trophy key="1" className="h-5 w-5" />,
        <Medal key="2" className="h-5 w-5" />,
        <Medal key="3" className="h-5 w-5" />
    ];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Liderlik Tablosu
                </h2>
            </div>

            <div className="space-y-4">
                {topUsers.map((user, i) => (
                    <div key={user.id} className="flex items-center gap-4 group">
                        <div className={`h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 ${colors[i] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            {icons[i] || <Star className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase">{user.department?.name || 'Genel'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{user.points || 0}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Puan</p>
                        </div>
                    </div>
                ))}

                {topUsers.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-xs italic">
                        Veri yükleniyor...
                    </div>
                )}
            </div>

            <button className="w-full mt-6 py-3 rounded-2xl bg-slate-50 text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors">
                Tüm Listeyi Gör
            </button>
        </div>
    );
}
