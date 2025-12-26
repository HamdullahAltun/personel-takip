"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    UserCheck,
    Briefcase,
    BrainCircuit
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExecutiveLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push("/login");
    };

    const navItems = [
        { href: "/executive/dashboard", label: "Genel Bakış & AI", icon: BrainCircuit },
        // Add more if needed, but the prompt focused on Dashboard analysis
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
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 border-r border-slate-800",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3 font-bold text-xl tracking-tight">
                        <Briefcase className="h-6 w-6 text-amber-500" />
                        <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">Yönetim</span>
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
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                                    isActive
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 group-hover:scale-110 transition-transform", isActive && "text-amber-500")} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/30"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 min-h-screen flex flex-col relative">
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

                <div className="p-6 lg:p-10 flex-1 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
