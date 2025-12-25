"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { Home, QrCode, ScanLine, User, FileClock, Megaphone, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = React.useState(false);

    // Reset loading when pathname changes
    React.useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    const navItems = [
        { href: "/dashboard", label: "Ana Sayfa", icon: Home },
        { href: "/scan", label: "Okut", icon: ScanLine },
        { href: "/leaves", label: "İzin", icon: FileClock },
        { href: "/badge", label: "Kimliğim", icon: QrCode },
        { href: "/announcements", label: "Duyurular", icon: Megaphone },
        { href: "/messages", label: "Mesajlar", icon: MessageSquareText },
        { href: "/profile", label: "Profilim", icon: User },
    ];

    // If scanning, maybe hide nav? No, keep it for exit.

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Header Mockup */}
            <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 flex items-center justify-between lg:hidden">
                <span className="font-bold text-lg text-slate-800">Personel Paneli</span>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    P
                </div>
            </header>

            <main className="flex-1 pb-20 p-4">
                {children}
            </main>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/80 z-[100] flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
                </div>
            )}

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            // We use onClick to set loading true. 
                            // Next.js navigates, and when the new route loads, the layout re-renders? 
                            // No, Layout persists. We need to clear loading on Pathname change.
                            // See useEffect below.
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => { if (pathname !== item.href) setIsLoading(true); }}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Desktop warning or alternative layout? 
          For now, just render children for desktop too, but maybe with a centered container 
          or redirect to a "Not optimized for desktop" page?
          We'll just wrap it in a max-w-md container for desktop viewing convenience.
      */}
        </div>
    );
}
