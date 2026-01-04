"use client";

import { Trophy, Medal, Crown } from "lucide-react";
import useSWR from "swr";
import { motion } from "framer-motion";

type User = {
    id: string;
    name: string;
    points: number;
    profilePicture?: string;
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function StaffLeaderboardPage() {
    const { data: users = [], isLoading } = useSWR<User[]>("/api/leaderboard", fetcher, { refreshInterval: 5000 });
    const { data: meData } = useSWR("/api/auth/me", fetcher);
    const myId = meData?.user?.id;

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <div className="max-w-lg mx-auto pb-24 space-y-6 px-4 md:px-0">
            <div className="flex items-center gap-3 pt-4">
                <Trophy className="text-yellow-500 h-8 w-8" />
                <h1 className="text-2xl font-bold text-slate-900">Liderlik Tablosu</h1>
            </div>

            {/* Podium for mobile */}
            {users.length >= 3 && !isLoading && (
                <div className="flex justify-center items-end gap-2 pb-8 border-b border-slate-200 min-h-[180px]">
                    <PodiumUser user={top3[1]} rank={2} color="bg-slate-100" height="h-24" delay={0.2} />
                    <PodiumUser user={top3[0]} rank={1} color="bg-gradient-to-t from-yellow-100 to-yellow-50" height="h-32" delay={0} />
                    <PodiumUser user={top3[2]} rank={3} color="bg-orange-50" height="h-16" delay={0.4} />
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center items-end gap-4 h-40 animate-pulse">
                    <div className="w-20 h-24 bg-slate-200 rounded-t-lg"></div>
                    <div className="w-20 h-32 bg-slate-200 rounded-t-lg"></div>
                    <div className="w-20 h-16 bg-slate-200 rounded-t-lg"></div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {users.length === 0 && !isLoading && (
                    <div className="p-8 text-center text-slate-400">Henüz veri yok.</div>
                )}

                {rest.map((u, i) => {
                    const rank = i + 4;
                    const isMe = u.id === myId;

                    return (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center p-4 border-b border-slate-100 last:border-none transition-colors
                                ${isMe ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}
                            `}
                        >
                            <span className={`w-8 font-bold text-sm ${isMe ? 'text-indigo-600' : 'text-slate-400'}`}>#{rank}</span>

                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full mr-3 overflow-hidden flex items-center justify-center font-bold text-slate-500 shadow-sm
                                    ${isMe ? 'ring-2 ring-indigo-500 ring-offset-2' : 'bg-slate-200'}
                                `}>
                                    {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : u.name[0]}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold truncate text-sm ${isMe ? 'text-indigo-700' : 'text-slate-900'}`}>
                                    {u.name} {isMe && <span className="text-[10px] font-normal text-indigo-500 ml-1">(Sen)</span>}
                                </h3>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                                ${isMe ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                            `}>{u.points} P</span>
                        </motion.div>
                    );
                })}


                {/* If user is in top 3, verify looking good in current view */}
                {top3.map((u) => {
                    if (u.id === myId) {
                        return (
                            <div key={u.id} className="p-3 bg-indigo-600 text-white text-center text-sm font-bold">
                                Harikasın! İlk 3 arasındasın! 🎉
                            </div>
                        )
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

function PodiumUser({ user, rank, color, height, delay }: { user: User, rank: number, color: string, height: string, delay: number }) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay }}
            className="flex flex-col items-center"
        >
            <div className="w-12 h-12 rounded-full border-2 border-white shadow mb-2 overflow-hidden flex items-center justify-center bg-slate-200 font-bold text-slate-500 relative ring-2 ring-slate-50">
                {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user.name[0]}
                <div className={`absolute -top-1 -right-1 rounded-full w-5 h-5 text-[10px] flex items-center justify-center shadow-sm font-bold text-white
                    ${rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-slate-400' : 'bg-orange-400'}
                `}>
                    {rank === 1 ? <Crown className="h-3 w-3" /> : rank}
                </div>
            </div>

            <div className={`w-20 sm:w-24 ${height} ${color} rounded-t-xl flex items-end justify-center pb-2 shadow-inner`}>
                <span className="font-bold text-slate-900/40 text-2xl">{rank}</span>
            </div>

            <div className="text-center mt-2">
                <p className="text-xs font-bold text-slate-700 truncate w-20 px-1">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">{user.points} P</p>
            </div>
        </motion.div>
    );
}
