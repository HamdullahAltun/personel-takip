"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MoreVertical, Search, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type User = {
    id: string;
    name: string;
    role: string;
    profilePicture?: string;
};

type Message = {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    read: boolean;
};

export default function MessagesPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null); // To know who is sender
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        // Fetch contacts
        fetch('/api/messages').then(r => r.json()).then(data => {
            setUsers(data);
            setLoading(false);
        });

        // Fetch me
        fetch('/api/auth/me').then(r => r.json()).then(u => setCurrentUser(u)).catch(() => { });
    }, []);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Polling
    useEffect(() => {
        if (!selectedUser) return;

        const fetchMsgs = () => {
            fetch(`/api/messages/${selectedUser.id}`)
                .then(r => r.json())
                .then(setMessages);
        };

        fetchMsgs();
        const interval = setInterval(fetchMsgs, 3000); // 3 seconds poll
        return () => clearInterval(interval);
    }, [selectedUser]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !selectedUser) return;

        const tempData = {
            id: 'temp-' + Date.now(),
            content: input,
            senderId: currentUser?.id,
            createdAt: new Date().toISOString(),
            read: false
        };

        // Optimistic
        setMessages(prev => [...prev, tempData]);
        setInput("");

        await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({
                receiverId: selectedUser.id,
                content: tempData.content
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        // Re-fetch to sync IDs
        fetch(`/api/messages/${selectedUser.id}`).then(r => r.json()).then(setMessages);
    };

    return (
        <div className="h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="font-bold text-lg mb-4 text-slate-800">Mesajlar</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition" placeholder="Ara..." />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {users.map(u => (
                        <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white transition border-b border-slate-100 ${selectedUser?.id === u.id ? 'bg-white border-l-4 border-l-indigo-600 shadow-sm' : ''}`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                    {u.profilePicture ? <img src={u.profilePicture} className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5" />}
                                </div>
                                {/* Dummy Online Status */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-bold text-slate-900 truncate">{u.name}</h3>
                                    {/* <span className="text-[10px] text-slate-400">12:30</span> */}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{u.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-100/50">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                    {selectedUser.profilePicture ? <img src={selectedUser.profilePicture} className="w-full h-full object-cover" /> : selectedUser.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedUser.name}</h3>
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        Çevrimiçi
                                    </span>
                                </div>
                            </div>
                            <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full"><MoreVertical className="h-5 w-5" /></button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                            {messages.map((msg, i) => {
                                const isMe = msg.senderId === currentUser?.id;
                                return (
                                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-indigo-200 justify-end' : 'text-slate-400'}`}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                                {isMe && <span>{msg.read ? '✓✓' : '✓'}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <form onSubmit={handleSend} className="flex gap-2 items-end">
                                <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Paperclip className="h-5 w-5" /></button>
                                <div className="flex-1 bg-slate-100 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-100 transition border border-transparent focus-within:border-indigo-300">
                                    <textarea
                                        className="w-full bg-transparent border-none resize-none focus:ring-0 max-h-32 min-h-[44px] py-2 px-1 text-sm text-slate-800 placeholder:text-slate-400"
                                        placeholder="Bir mesaj yazın..."
                                        rows={1}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition shadow-lg shadow-indigo-200"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <UserIcon className="h-10 w-10 text-slate-400" />
                        </div>
                        <p className="text-lg font-medium">Bir sohbet seçin</p>
                        <p className="text-sm">Mesajlaşmaya başlamak için soldaki listeden birini seçin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
