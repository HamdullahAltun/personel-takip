"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';

type Message = {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
};

export default function ChatClient({ id }: { id: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch My ID (simple way: check session endpoint or decode token. For now, we assume we can filter by senderId != receiverId)
    // Accessing my ID is easier if we have a context or hook. 
    // Let's verify who is who by visually checking alignment.
    // Hack: We verify 'isMe' by checking if senderId !== param.id. (Since param.id is the OTHER user)

    const fetchMessages = async () => {
        if (!id) return;
        const res = await fetch(`/api/messages/${id}`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data);
        }
    };

    const fetchUser = async () => {
        if (!id) return;
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
            const data = await res.json();
            setReceiverName(data.name);
        }
    }

    useEffect(() => {
        if (id) {
            fetchUser();
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Polling
            return () => clearInterval(interval);
        }
    }, [id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId: id, content }),
            headers: { 'Content-Type': 'application/json' }
        });
        setContent("");
        fetchMessages();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <User className="h-5 w-5" />
                </div>
                <h2 className="font-bold text-slate-800">{receiverName || "Sohbet"}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/50">
                {messages.map(msg => {
                    const isMe = msg.senderId !== id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white text-slate-800 rounded-bl-none'
                                }`}>
                                {msg.content}
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
                <input
                    className="flex-1 border border-slate-300 rounded-full px-4 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Mesaj yazın..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition">
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
