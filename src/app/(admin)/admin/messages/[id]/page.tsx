"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMessageDetail({ params }: { params: Promise<{ id: string }> }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [id, setId] = useState("");

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    useEffect(() => {
        if (id) {
            fetch(`/api/admin/messages/${id}`)
                .then(r => r.json())
                .then(setMessages);
        }
    }, [id]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Sohbet Kayıtları</h1>

            <div className="space-y-4">
                {messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-white rounded-xl">Kayıt bulunamadı.</div>
                ) : messages.map((msg, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between mb-2">
                            <div className="font-bold text-sm">
                                <span className="text-blue-600">Gönderen:</span> {msg.sender?.name}
                                <span className="text-slate-400 mx-2">→</span>
                                <span className="text-green-600">Alıcı:</span> {msg.receiver?.name}
                            </div>
                            <span className="text-xs text-slate-400">
                                {new Date(msg.createdAt).toLocaleString('tr-TR')}
                            </span>
                        </div>
                        <p className="text-slate-800 bg-slate-50 p-2 rounded-lg">{msg.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
