"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Award, Plus, Star } from "lucide-react";

type User = {
    id: string;
    name: string;
    points: number;
    profilePicture?: string;
    role: string;
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Points Form
    const [selectedUser, setSelectedUser] = useState("");
    const [amount, setAmount] = useState(10);
    const [reason, setReason] = useState("");
    const [allUsers, setAllUsers] = useState<User[]>([]); // For dropdown

    useEffect(() => {
        fetchData();
        fetchAllUsers();
    }, []);

    const fetchData = async () => {
        const res = await fetch(`/api/leaderboard?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) setUsers(await res.json());
        setLoading(false);
    };

    const fetchAllUsers = async () => {
        const res = await fetch("/api/users");
        if (res.ok) setAllUsers(await res.json());
    };

    const handleGivePoints = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch("/api/leaderboard", {
            method: "POST",
            body: JSON.stringify({ userId: selectedUser, amount: Number(amount), reason }),
            headers: { "Content-Type": "application/json" }
        });
        setShowModal(false);
        await fetchData();
        setReason("");
    };

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="text-yellow-500 h-8 w-8" />
                        Liderlik Tablosu
                    </h1>
                    <p className="text-slate-500">En çok katkı sağlayan personeller</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus className="h-5 w-5" />
                    Puan Ver
                </button>
            </div>

            {/* Podium */}
            {users.length >= 3 && (
                <div className="flex justify-center items-end gap-4 md:gap-8 pb-8 border-b border-slate-200">
                    {/* 2nd Place */}
                    <PodiumUser user={top3[1]} rank={2} color="bg-gray-200" height="h-32" />
                    {/* 1st Place */}
                    <PodiumUser user={top3[0]} rank={1} color="bg-yellow-100" height="h-40" />
                    {/* 3rd Place */}
                    <PodiumUser user={top3[2]} rank={3} color="bg-orange-100" height="h-24" />
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Sıra</th>
                            <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Personel</th>
                            <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase">Puan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u, i) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition">
                                <td className="p-4 w-16 text-center font-bold text-slate-400">#{i + 1}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                                            {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : u.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.role}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm shadow-sm">{u.points} P</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">Puan Ver</h2>
                        <form onSubmit={handleGivePoints} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Personel</label>
                                <select required className="w-full border p-2 rounded-lg" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                                    <option value="">Seçiniz</option>
                                    {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Miktar</label>
                                <input type="number" required className="w-full border p-2 rounded-lg" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Sebep</label>
                                <input required className="w-full border p-2 rounded-lg" placeholder="Örn: Proje başarısı" value={reason} onChange={e => setReason(e.target.value)} />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">Gönder</button>
                            <button type="button" onClick={() => setShowModal(false)} className="w-full bg-slate-100 text-slate-600 py-2 rounded-lg mt-2">İptal</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function PodiumUser({ user, rank, color, height }: { user: User, rank: number, color: string, height: string }) {
    if (!user) return <div className={`w-24 ${height} bg-slate-50 rounded-t-xl opacity-50`}></div>;

    return (
        <div className="flex flex-col items-center">
            <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-slate-200 text-xl font-bold text-slate-500 z-10 relative">
                    {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover" /> : user.name[0]}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md font-bold text-sm border border-slate-100">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </div>
            </div>
            <div className="text-center mb-1">
                <div className="font-bold text-slate-800 text-sm">{user.name}</div>
                <div className="text-xs text-indigo-600 font-bold">{user.points} P</div>
            </div>
            <div className={`w-24 md:w-32 ${height} ${color} rounded-t-xl shadow-inner border-x border-t border-white/50 flex flex-col justify-end items-center pb-4`}>
                <span className="text-4xl font-black text-slate-900/10 opacity-50">{rank}</span>
            </div>
        </div>
    );
}
