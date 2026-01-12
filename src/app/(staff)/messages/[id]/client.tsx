"use client";

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { Send, User, Check, CheckCheck, ArrowLeft, Phone, MoreVertical, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { socket } from "@/lib/socket";

type Message = {
    id: string;
    content: string | null;
    attachmentUrl?: string | null;
    senderId: string;
    createdAt: string;
    read: boolean;
};

export default function ChatClient({ id }: { id: string }) {
    // const [messages, setMessages] = useState<Message[]>([]); // Removed for SWR
    const [content, setContent] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverImage, setReceiverImage] = useState<string | null>(null);
    const [receiverRole, setReceiverRole] = useState("");
    const [uploading, setUploading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetcher = (url: string) => fetch(url).then(r => r.json());

    const { data: messages = [], mutate } = useSWR<Message[]>(
        id ? `/api/messages/${id}` : null,
        fetcher,
        { refreshInterval: 5000 } // Increase interval since we have sockets
    );

    // Real-time listener
    useEffect(() => {
        function onReceiveMessage(data: any) {
            // If message is from current chat partner, update view
            if (data.senderId === id || (data.receiverId === id && data.senderId === 'ME')) {
                // We can either fetch or optimistically update. 
                // Simple approach: mutate() to re-fetch
                mutate();
            }
        }

        socket.on("receive_message", onReceiveMessage);

        return () => {
            socket.off("receive_message", onReceiveMessage);
        };
    }, [id, mutate]);

    // Profile Fetching
    useEffect(() => {
        if (id) {
            fetch(`/api/users/${id}/profile`)
                .then(r => r.json())
                .then(data => {
                    setReceiverName(data.name);
                    setReceiverImage(data.profilePicture);
                    setReceiverRole(data.role);
                });
        }
    }, [id]);

    useEffect(() => {
        if (bottomRef.current) {
            // Only scroll if we are near bottom or it's initial load
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.senderId === id && !lastMsg.read) {
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
            const data = await res.json();
            // Emit socket event for real-time delivery
            // We emit to the receiver.
            // data.message contains the created message
            if (data && data.message) {
                socket.emit("send_message", {
                    ...data.message,
                    receiverId: id,
                });
            }

            setContent("");
            mutate();
        }
    };

    return (
        <div className="flex flex-col h-[80vh] md:h-[calc(100vh-140px)] bg-slate-50 md:rounded-3xl md:shadow-lg border-x md:border border-slate-200 overflow-hidden relative">
            {/* Header */}
            <div className="bg-white/90 backdrop-blur-md p-3 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-2">
                    <Link href="/messages" className="bg-slate-50 p-2 rounded-full text-slate-600 hover:bg-slate-100 transition active:scale-95">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-3 ml-1">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 ring-2 ring-white shadow-sm">
                            {receiverImage ? (
                                <img src={receiverImage} alt={receiverName} className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-5 w-5 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-900 leading-none text-base">{receiverName || "Sohbet"}</h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {receiverRole === 'ADMIN' ? 'Yönetici' : receiverRole === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#eef2f6]">
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
                                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border border-white mr-2 self-end mb-1 shadow-sm shrink-0">
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
                                {msg.attachmentUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden bg-black/5">
                                        <img src={msg.attachmentUrl} alt="Eklenti" className="max-w-full max-h-[250px] object-contain" />
                                    </div>
                                )}
                                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
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

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];

                        // Client-side validation
                        if (file.size > 5 * 1024 * 1024) {
                            alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
                            return;
                        }

                        setUploading(true);
                        const formData = new FormData();
                        formData.append("file", file);

                        try {
                            const upRes = await fetch("/api/upload", {
                                method: "POST",
                                body: formData
                            });

                            if (!upRes.ok) {
                                const err = await upRes.json();
                                alert(err.error || "Yükleme hatası");
                                setUploading(false);
                                return;
                            }

                            const { url } = await upRes.json();

                            // Send message with attachment
                            const res = await fetch('/api/messages', {
                                method: 'POST',
                                body: JSON.stringify({
                                    receiverId: id,
                                    content: content.trim(),
                                    attachmentUrl: url
                                }),
                                headers: { 'Content-Type': 'application/json' }
                            });

                            if (res.ok) {
                                setContent("");
                                mutate();
                            }
                        } catch (err) {
                            console.error(err);
                            alert("Bir hata oluştu");
                        } finally {
                            setUploading(false);
                        }
                    }
                }}
            />

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-end gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 pb-safe">
                <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition self-center disabled:opacity-50 active:scale-95"
                >
                    {uploading ? <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                </button>
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all flex items-center">
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm max-h-32 min-h-[24px]"
                        placeholder="Mesaj yazın..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!content.trim() && !uploading} // Allow clicking if content exists (even if uploading? No, prevent empty sends)
                    // Logic: If content exists OR image is attached (handled in upload flow though). 
                    // This button sends TEXT. Image sends automatically after upload.
                    // So disable if no text.
                    className="bg-blue-600 disabled:bg-slate-300 disabled:shadow-none text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-blue-200 shadow-md self-center"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
