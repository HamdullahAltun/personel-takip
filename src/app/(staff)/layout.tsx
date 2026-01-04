"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    Home, QrCode, ScanLine, User, FileClock, Megaphone, MessageSquareText,
    LogOut, ChevronDown, Menu as MenuIcon, ClipboardList, Receipt, BrainCircuit,
    Calendar, MessageSquare, BookOpen, CalendarClock, LayoutGrid, X, UserCog,
    Share2, CalendarRange, Crown, Network, Bot, Gift, Banknote, MapPin, Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceAssistant from "@/components/VoiceAssistant";
import StatusPoller from "@/components/StatusPoller";
import LocationTracker from "@/components/LocationTracker";
import EmergencyButton from "@/components/EmergencyButton";

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
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Notification Logic
    React.useEffect(() => {
        const checkPermission = async () => {
            if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    try {
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
        setTimeout(checkPermission, 3000);
    }, []);

    const [userRole, setUserRole] = useState<string>("");
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/me').then(res => res.json()).then(data => {
            if (data.user) {
                setUserName(data.user.name);
                setProfilePicture(data.user.profilePicture);
                setUserRole(data.user.role);
            }
        }).catch(() => { });
    }, []);

    // Define all items
    const allItems = [
        { href: "/dashboard", label: "Ana Sayfa", icon: Home, priority: 1 },
        { href: "/scan", label: "İşlem Yap", icon: ScanLine, priority: 2 },
        { href: "/tasks", label: "Görevler", icon: ClipboardList, priority: 3 },
        { href: "/messages", label: "Mesajlar", icon: MessageSquareText, priority: 4 },

        // New Features (In Menu)
        { href: "/dashboard/field-tasks", label: "Saha Görevleri", icon: MapPin, priority: 5 },
        { href: "/dashboard/onboarding", label: "Onboarding", icon: ClipboardList, priority: 5 },
        { href: "/social", label: "Sosyal Akış", icon: Share2, priority: 5 },
        { href: "/shifts", label: "Vardiyalar", icon: CalendarRange, priority: 6 },
        { href: "/leaderboard", label: "Liderlik", icon: Crown, priority: 7 },
        { href: "/organization", label: "Organizasyon", icon: Network, priority: 8 },
        { href: "/knowledge", label: "Bilgi Bankası", icon: Database, priority: 8 },
        { href: "/ai-assistant", label: "AI Asistan", icon: Bot, priority: 8 },
        { href: "/payroll", label: "Maaşım", icon: Banknote, priority: 8 },
        { href: "/rewards", label: "Ödül Mağazası", icon: Gift, priority: 8 },

        // Secondary
        { href: "/expenses", label: "Harcamalar", icon: Receipt, priority: 10 },
        { href: "/users", label: "Personel", icon: User, priority: 10 },
        { href: "/events", label: "Etkinlikler", icon: Calendar, priority: 10 },
        { href: "/survey", label: "Anketler", icon: MessageSquare, priority: 10 },
        { href: "/lms", label: "Eğitim", icon: BookOpen, priority: 10 },
        { href: "/booking", label: "Rezervasyon", icon: CalendarClock, priority: 10 },
        { href: "/visitors", label: "Ziyaretçi Davet", icon: QrCode, priority: 10 },
    ];

    if (userRole === 'EXECUTIVE') {
        allItems.push({ href: "/executive/dashboard", label: "Rapor", icon: BrainCircuit, priority: 5 });
    }

    const primaryNavItems = allItems.filter(i => i.priority <= 4).sort((a, b) => a.priority - b.priority);
    const secondaryNavItems = allItems.filter(i => i.priority > 4);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <StatusPoller onUnreadChange={setUnreadCount} />
            <LocationTracker />

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
                        className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold ring-2 ring-white shadow-sm active:scale-95 transition-all overflow-hidden"
                    >
                        {profilePicture ? (
                            <img src={profilePicture} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            userName ? userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />
                        )}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfileMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                            <div className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-slate-100 w-56 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-2 border-b border-slate-50 mb-2">
                                    <p className="text-sm font-bold text-slate-900">{userName}</p>
                                    <p className="text-xs text-slate-500">
                                        {userRole === 'ADMIN' ? 'Yönetici' : userRole === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                                    </p>
                                </div>
                                {userRole === 'ADMIN' && (
                                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 hover:bg-slate-50 font-bold transition-colors">
                                        <UserCog className="h-4 w-4" />
                                        Yönetici Paneli
                                    </Link>
                                )}
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

            <main className="flex-1 pb-safe-nav p-4 flex flex-col">
                {children}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 lg:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between h-[65px] px-2">
                    {/* Primary Items */}
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (pathname !== item.href) setIsLoading(true);
                                    setShowMobileMenu(false);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 relative group active:scale-95 transition-transform",
                                    isActive ? "text-indigo-600" : "text-slate-400"
                                )}
                            >
                                <div className={cn(
                                    "relative p-1.5 rounded-xl transition-all duration-300",
                                    isActive ? "bg-indigo-50 -translate-y-1" : ""
                                )}>
                                    <Icon className={cn("h-6 w-6", isActive && "fill-indigo-600/20")} />
                                    {item.href === '/messages' && unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white px-0.5 animate-pulse">
                                            {unreadCount}
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium transition-all opacity-100",
                                    isActive ? "font-bold" : "font-normal"
                                )}>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Menu Toggle Item */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className={cn(
                            "flex flex-col items-center justify-center w-full h-full space-y-1 relative group active:scale-95 transition-transform",
                            showMobileMenu ? "text-indigo-600" : "text-slate-400"
                        )}
                    >
                        <div className={cn(
                            "relative p-1.5 rounded-xl transition-all duration-300",
                            showMobileMenu ? "bg-indigo-50 -translate-y-1" : ""
                        )}>
                            <LayoutGrid className={cn("h-6 w-6", showMobileMenu && "fill-indigo-600/20")} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium transition-all",
                            showMobileMenu ? "font-bold" : "font-normal"
                        )}>Menü</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay (Drawer) */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
                    <div className="absolute bottom-[calc(65px+env(safe-area-inset-bottom))] left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 border-t border-slate-100 max-h-[70vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-900">Tüm Uygulamalar</h3>
                            <button onClick={() => setShowMobileMenu(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {secondaryNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => {
                                            if (pathname !== item.href) setIsLoading(true);
                                            setShowMobileMenu(false);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl gap-2 transition-all active:scale-95",
                                            isActive ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl", isActive ? "bg-white shadow-sm" : "bg-white shadow-sm")}>
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
