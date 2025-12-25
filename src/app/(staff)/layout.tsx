"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, QrCode, ScanLine, User, FileClock, Megaphone, MessageSquareText, LogOut, ChevronDown, Menu as MenuIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

    // Reset loading when pathname changes
    React.useEffect(() => {
        setIsLoading(false);
        setShowProfileMenu(false);
    }, [pathname]);

    React.useEffect(() => {
        // Fetch user name
        fetch('/api/profile/me').then(res => res.json()).then(data => {
            if (data.name) setUserName(data.name);
        }).catch(() => { });

        const fetchUnread = async () => {
            try {
                const res = await fetch('/api/messages/conversations');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const count = data.filter((c: any) => c.unreadCount > 0).length;
                        setUnreadCount(count);
                    }
                }
            } catch (error) { }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 10000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { href: "/dashboard", label: "Ana Sayfa", icon: Home },
        { href: "/scan", label: "İşlem Yap", icon: ScanLine },
        { href: "/users", label: "Personel", icon: User },
        { href: "/announcements", label: "Duyurular", icon: Megaphone },
        { href: "/messages", label: "Mesajlar", icon: MessageSquareText },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Creative Header */}
            <header className="bg-white px-4 py-4 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100/50 shadow-sm backdrop-blur-md bg-white/80 lg:hidden">
                <div>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">Personel Paneli</p>
                    <h1 className="font-bold text-slate-800 text-lg leading-none">
                        Merhaba, {userName.split(' ')[0] || 'Personel'}! 👋
                    </h1>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm active:scale-95 transition-transform"
                    >
                        {userName ? userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 w-48 py-2 animate-in fade-in slide-in-from-top-2">
                            <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                                <User className="h-4 w-4" />
                                Profilim
                            </Link>
                            <Link href="/leaves" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                                <FileClock className="h-4 w-4" />
                                İzinlerim
                            </Link>
                            <div className="h-px bg-slate-100 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors text-left"
                            >
                                <LogOut className="h-4 w-4" />
                                Çıkış Yap
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 pb-24 p-4">
                {children}
            </main>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
                </div>
            )}

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
        </div>
    );
}
