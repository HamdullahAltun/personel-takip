"use client";

import { useState, useEffect } from "react";
import { Bell, Send, User, Users, Loader2 } from "lucide-react";

export default function NotificationsPage() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState("ALL"); // ALL or specific user ID
    const [users, setUsers] = useState<any[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetch('/api/users').then(res => res.json()).then(setUsers);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        try {
            await fetch('/api/admin/notifications/broadcast', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body: message,
                    targetUserId: target === 'ALL' ? null : target
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            alert("Bildirim gönderildi!");
            setTitle("");
            setMessage("");
        } catch (e) {
            alert("Hata oluştu.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="h-6 w-6 text-indigo-600" />
                    Bildirim Gönder
                </h1>
                <p className="text-slate-500">Tüm personele veya belirli bir kişiye duyuru yapın.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Alıcı</label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setTarget("ALL")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition ${target === 'ALL' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <Users className="h-5 w-5" />
                                Herkes
                            </button>
                            <button
                                type="button"
                                onClick={() => setTarget(users[0]?.id || "SPECIFIC")}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition ${target !== 'ALL' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <User className="h-5 w-5" />
                                Kişi Seç
                            </button>
                        </div>

                        {target !== 'ALL' && (
                            <select
                                value={target}
                                onChange={e => setTarget(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200"
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Başlık</label>
                        <input
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 font-bold"
                            placeholder="Örn: Acil Toplantı"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Mesaj İçeriği</label>
                        <textarea
                            required
                            rows={4}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200"
                            placeholder="Bildirim detayları..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={sending}
                            type="submit"
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                            Gönder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
