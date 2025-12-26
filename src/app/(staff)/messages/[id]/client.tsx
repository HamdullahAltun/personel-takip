"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User, Check, CheckCheck, ArrowLeft, Phone, MoreVertical, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

type Message = {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    read: boolean;
};

export default function ChatClient({ id }: { id: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [content, setContent] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverImage, setReceiverImage] = useState<string | null>(null);
    const [receiverRole, setReceiverRole] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

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
        const res = await fetch(`/api/users/${id}/profile`); // Use profile endpoint to get details including image
        if (res.ok) {
            const data = await res.json();
            setReceiverName(data.name);
            setReceiverImage(data.profilePicture);
            setReceiverRole(data.role);
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
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.senderId === id) {
                    fetch(`/api/messages/${id}/read`, { method: 'POST' });
                }
            }
        }
    }, [messages, id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const res = await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId: id, content }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setContent("");
            fetchMessages();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-3xl shadow-lg border border-slate-200 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Link href="/messages" className="bg-slate-100 p-2 rounded-full text-slate-600 hover:bg-slate-200 transition">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                            {receiverImage ? (
                                <img src={receiverImage} alt={receiverName} className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 leading-none">{receiverName || "Sohbet"}</h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {receiverRole === 'ADMIN' ? 'Yönetici' : receiverRole === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                        <Phone className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition">
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f4f8]">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-50 space-y-2">
                        <div className="bg-slate-200 p-4 rounded-full">
                            <Send className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">Sohbeti başlatın</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.senderId !== id;
                    // Check if previous message was from same sender to group them
                    const isSequence = index > 0 && messages[index - 1].senderId === msg.senderId;

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSequence ? 'mt-1' : 'mt-4'}`}>
                            {!isMe && !isSequence && (
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white mr-2 self-end mb-1 shadow-sm">
                                    {receiverImage ? (
                                        <img src={receiverImage} alt={receiverName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-slate-400" />
                                    )}
                                </div>
                            )}
                            {!isMe && isSequence && <div className="w-10" />} {/* Spacer for alignment */}

                            <div className={`max-w-[75%] px-4 py-2.5 shadow-sm text-sm relative group transition-all
                                ${isMe
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                    : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-100'
                                }`}>
                                {msg.content}
                                <div className={`flex items-center justify-end gap-1 mt-1 opacity-70`}>
                                    <span className={`text-[9px] font-medium`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        msg.read ?
                                            <CheckCheck className="h-3 w-3" /> :
                                            <Check className="h-3 w-3" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} className="h-2" />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-end gap-2 shadow-lg z-20">
                <button type="button" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition self-center">
                    <ImageIcon className="h-5 w-5" />
                </button>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all flex items-center">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm max-h-32"
                        placeholder="Bir mesaj yazın..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!content.trim()}
                    className="bg-blue-600 disabled:bg-slate-300 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-blue-200 shadow-md self-center"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
