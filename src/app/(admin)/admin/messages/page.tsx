"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function AdminMessagesPage() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/users').then(r => r.json()).then(setUsers);
    }, []);

    // This page lists all staff. Clicking one opens their chat logs.
    // Ideally, we group by conversation, but 'users' list is a simple proxy for that.

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Mesajlaşma Kayıtları</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {users.map(u => (
                        <a href={`/admin/messages/${u.id}`} key={u.id} className="block p-4 hover:bg-slate-50 transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900">{u.name}</h3>
                                    <p className="text-xs text-slate-500">{u.role}</p>
                                </div>
                                <span className="text-sm text-blue-600 font-medium">Kayıtları Gör →</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}
