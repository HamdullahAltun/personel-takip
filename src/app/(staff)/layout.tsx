"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, QrCode, ScanLine, User, FileClock, Megaphone, MessageSquareText, LogOut, ChevronDown, Menu as MenuIcon, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import AIAssistant from "@/components/AIAssistant";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [userName, setUserName] = React.useState("");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Notification Logic
    React.useEffect(() => {
        const checkPermission = async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    try {
                        // Dynamic import to avoid SSR issues if firebase uses window
                        const { messaging } = await import('@/lib/firebase');
                        if (messaging) {
                            const { getToken } = await import('firebase/messaging');
                            const token = await getToken(messaging, {
                                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                            });
                            if (token) {
                                await fetch('/api/notifications/register', {
                                    method: 'POST',
                                    body: JSON.stringify({ token })
                                });
                            }
                        }
                    } catch (err) {
                        console.log('Notification permission ignored or error', err);
                    }
                }
            }
        };
        // Delay slightly
        setTimeout(checkPermission, 3000);
    }, []);

    const navItems = [
        { href: "/dashboard", label: "Ana Sayfa", icon: Home },
        { href: "/scan", label: "İşlem Yap", icon: ScanLine },
        { href: "/tasks", label: "Görevler", icon: ClipboardList },
        { href: "/expenses", label: "Harcamalar", icon: Receipt },
        { href: "/users", label: "Personel", icon: User },
        { href: "/messages", label: "Mesajlar", icon: MessageSquareText },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 fixed top-0 left-0 right-0 z-50 pt-safe pb-4 px-4 shadow-sm lg:hidden transition-all duration-300 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mb-0.5">Personel Paneli</p>
                    <h1 className="font-bold text-slate-900 text-lg leading-none">
                        {userName ? `Merhaba, ${userName.split(' ')[0]}!` : 'Hoş Geldiniz'} 👋
                    </h1>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold ring-2 ring-white shadow-sm active:scale-95 transition-all"
                    >
                        {userName ? userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                            <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 w-56 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                    <p className="text-sm font-bold text-slate-900">{userName}</p>
                                    <p className="text-xs text-slate-500">Personel</p>
                                </div>
                                <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                                    <User className="h-4 w-4" />
                                    Profilim
                                </Link>
                                <Link href="/leaves" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                                    <FileClock className="h-4 w-4" />
                                    İzinlerim
                                </Link>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors text-left"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Çıkış Yap
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Spacer for Fixed Header */}
            <div className="h-[calc(70px+env(safe-area-inset-top))] lg:hidden" />

            <main className="flex-1 pb-safe-nav p-4">
                {children}
            </main>

            {/* Loading Overlay */}
            {/* ... */}

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-10 lg:hidden pb-safe">
                <div className="flex items-center justify-around h-[70px] px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => { if (pathname !== item.href) setIsLoading(true); }}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 relative group",
                                    isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-500"
                                )}
                            >
                                <div className={cn(
                                    "relative p-1.5 rounded-xl transition-all duration-300",
                                    isActive ? "bg-indigo-50 -translate-y-1" : "group-hover:bg-slate-50"
                                )}>
                                    <Icon className={cn("h-6 w-6", isActive && "fill-indigo-600/20")} />
                                    {item.href === '/messages' && unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white px-0.5">
                                            {unreadCount}
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium transition-all",
                                    isActive ? "font-bold" : "font-normal"
                                )}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <AIAssistant />
        </div>
    );
}
