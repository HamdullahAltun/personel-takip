"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

type User = {
    id: string;
    name: string;
    points: number;
    profilePicture?: string;
};

export default function StaffLeaderboardPage() {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fetch("/api/leaderboard", { cache: "no-store" }).then(r => r.json()).then(setUsers);
    }, []);

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <div className="max-w-lg mx-auto pb-20 space-y-6">
            <div className="flex items-center gap-3">
                <Trophy className="text-yellow-500 h-8 w-8" />
                <h1 className="text-2xl font-bold text-slate-900">Liderlik Tablosu</h1>
            </div>

            {/* Podium for mobile */}
            {users.length >= 3 && (
                <div className="flex justify-center items-end gap-2 pb-6 border-b border-slate-200">
                    <PodiumUser user={top3[1]} rank={2} color="bg-gray-100" height="h-24" />
                    <PodiumUser user={top3[0]} rank={1} color="bg-yellow-50" height="h-32" />
                    <PodiumUser user={top3[2]} rank={3} color="bg-orange-50" height="h-16" />
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {users.map((u, i) => (
                    <div key={u.id} className="flex items-center p-4 border-b border-slate-100 last:border-none">
                        <span className="w-8 font-bold text-slate-400">#{i + 1}</span>
                        <div className="w-10 h-10 rounded-full bg-slate-200 mr-3 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                            {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : u.name[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900">{u.name}</h3>
                        </div>
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{u.points} P</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PodiumUser({ user, rank, color, height }: { user: User, rank: number, color: string, height: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white shadow mb-2 overflow-hidden flex items-center justify-center bg-slate-200 font-bold text-slate-500 relative">
                {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user.name[0]}
                <div className="absolute top-0 right-0 bg-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center shadow font-bold text-slate-900">{rank}</div>
            </div>
            <div className={`w-20 ${height} ${color} rounded-t-lg flex items-end justify-center pb-2`}>
                <span className="font-bold text-slate-900/50 text-xl">{rank}</span>
            </div>
            <div className="text-center mt-1">
                <p className="text-[10px] font-bold text-slate-900 truncate w-20">{user.name.split(' ')[0]}</p>
                <p className="text-[10px] font-bold text-indigo-600">{user.points} P</p>
            </div>
        </div>
    );
}
