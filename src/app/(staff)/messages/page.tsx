"use client";

import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import Link from 'next/link';

type UserData = {
    id: string;
    name: string;
    role: string;
};

export default function MessageListPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch('/api/messages')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
            });
    }, []);

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 px-4">Mesajlar</h1>

            <div className="px-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Kişi ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {filteredUsers.map(user => (
                        <Link
                            key={user.id}
                            href={`/messages/${user.id}`}
                            className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="bg-slate-100 p-3 rounded-full text-slate-600">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">{user.name}</h3>
                                <p className="text-xs text-slate-500 capitalize">{user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}</p>
                            </div>
                        </Link>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500">Kişi bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
