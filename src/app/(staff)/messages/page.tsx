"use client";

import { useState, useEffect } from 'react';
import { Search, User, MessageSquarePlus, Circle } from 'lucide-react';
import Link from 'next/link';

type Conversation = {
    user: {
        id: string;
        name: string;
        role: string;
    };
    lastMessage: {
        content: string;
        createdAt: string;
        read: boolean;
        senderId: string;
    };
    unreadCount: number;
};

type UserData = {
    id: string;
    name: string;
    role: string;
};

export default function MessageListPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserData[]>([]);
    const [search, setSearch] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = () => {
        fetch('/api/messages/conversations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setConversations(data);
            });
    };

    const fetchAllUsers = () => {
        // We reuse the generic messages endpoint or users endpoint. 
        // The previous /api/messages GET returned all users. 
        // Let's assume we use /api/users or similar.
        // Actually, previous /api/messages GET returned all "contacts".
        // Let's use /api/users but filter client side for now or create a dedicated endpoint.
        // Or simpler: just use /api/messages endpoint (which I wrote before to return all users).
        // Wait, I overwrote /api/messages/route.ts in previous turn? 
        // No, I overwrote /api/messages/[id]. 
        // /api/messages/route.ts POST/GET is still there. GET returns all users.
        fetch('/api/messages')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAllUsers(data);
            });
    };

    const handleNewChatClick = () => {
        setShowNewChat(true);
        fetchAllUsers();
    };

    const filteredConversations = conversations.filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()));
    const filteredUsers = allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col relative">
            <div className="flex items-center justify-between px-4">
                <h1 className="text-2xl font-bold text-slate-800">Sohbetler</h1>
                <button
                    onClick={handleNewChatClick}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition"
                    title="Yeni Sohbet"
                >
                    <MessageSquarePlus className="h-6 w-6" />
                </button>
            </div>

            <div className="px-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Sohbet ara..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-20">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                    {filteredConversations.map(conv => (
                        <Link
                            key={conv.user.id}
                            href={`/messages/${conv.user.id}`}
                            className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors relative"
                        >
                            <div className="relative">
                                <div className="bg-slate-100 p-3 rounded-full text-slate-600">
                                    <User className="h-6 w-6" />
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm border-2 border-white">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className="font-bold text-slate-900 truncate">{conv.user.name}</h3>
                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                                    {conv.lastMessage.content}
                                </p>
                            </div>
                        </Link>
                    ))}
                    {filteredConversations.length === 0 && !showNewChat && (
                        <div className="p-8 text-center text-slate-500">
                            Sohbet bulunamadı.<br />
                            <button onClick={handleNewChatClick} className="text-blue-600 font-bold mt-2 hover:underline">
                                Yeni Sohbet Başlat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
                    <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Yeni Sohbet</h2>
                            <button onClick={() => setShowNewChat(false)} className="text-slate-400 hover:text-slate-800 p-2">
                                Kapat
                            </button>
                        </div>
                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Kişi ara..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {filteredUsers.map(user => (
                                <Link
                                    key={user.id}
                                    href={`/messages/${user.id}`}
                                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    <div className="bg-slate-100 p-2.5 rounded-full text-slate-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                                        <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
