"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    QrCode,
    LogOut,
    Menu,
    X,
    UserCog,
    CalendarCheck,
    Bell,
    Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        // In a real app, call logout API to clear cookie
        // For now, just delete cookie manually or similar
        document.cookie = "personel_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        router.push("/login");
    };

    const [isLoading, setIsLoading] = useState(false);

    // When pathname changes, we are "arrived", so stop loading
    useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    const navItems = [
        { href: "/admin/dashboard", label: "Panel", icon: LayoutDashboard },
        { href: "/admin/employees", label: "Personeller", icon: Users },
        { href: "/admin/leaves", label: "İzin Talepleri", icon: CalendarCheck },
        { href: "/admin/qr", label: "QR İşlemleri", icon: QrCode },
        { href: "/admin/announcements", label: "Duyurular", icon: Bell },
        { href: "/admin/awards", label: "Ödüller", icon: Trophy },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <UserCog className="h-6 w-6 text-blue-400" />
                        <span>Yönetici</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    setIsSidebarOpen(false);
                                    if (pathname !== item.href) setIsLoading(true);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen flex flex-col relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[60] flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-4"></div>
                        <p className="text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
                    </div>
                )}
                {/* Mobile Header */}
                <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-4 lg:hidden">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-semibold text-slate-900">Yönetim Paneli</span>
                </header>

                <div className="p-4 lg:p-8 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
