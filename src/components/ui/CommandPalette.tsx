"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, Calendar, User, Settings, LogOut, Moon, Sun, Home, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItemProps {
    icon: React.ElementType;
    label: string;
    shortcut?: string;
    onClick: () => void;
    selected?: boolean;
}

function CommandItem({ icon: Icon, label, shortcut, onClick, selected }: CommandItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors rounded-xl",
                selected ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
        >
            <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4", selected ? "text-indigo-600" : "text-slate-400")} />
                <span className={selected ? "font-bold" : "font-medium"}>{label}</span>
            </div>
            {shortcut && (
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 border border-slate-200">
                    {shortcut}
                </span>
            )}
        </button>
    );
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleOpen();
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleOpen]);

    const navigationCommands = [
        { label: "Ana Sayfa", icon: Home, href: "/dashboard", type: "nav" },
        { label: "Profil", icon: User, href: "/profile", type: "nav" },
        { label: "Vardiyalarım", icon: Calendar, href: "/shifts", type: "nav" },
        { label: "İzin Talepleri", icon: Clock, href: "/leaves", type: "nav" },
        { label: "Bordro & Maaş", icon: CreditCard, href: "/payroll", type: "nav" },
        { label: "Ayarlar", icon: Settings, href: "/settings", type: "nav" },
    ];

    const actionCommands = [
        { label: "Tema Değiştir", icon: Moon, action: () => alert("Tema değiştirme henüz aktif değil!"), type: "action" },
        { label: "Çıkış Yap", icon: LogOut, action: () => router.push("/logout"), type: "action" },
    ];

    const allCommands = [...navigationCommands, ...actionCommands].filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleNavigation = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allCommands.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allCommands.length) % allCommands.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                const selected = allCommands[selectedIndex];
                if (selected) {
                    if (selected.type === "nav" && 'href' in selected) {
                        router.push(selected.href as string);
                    } else if (selected.type === "action" && 'action' in selected) {
                        (selected.action as () => void)();
                    }
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener("keydown", handleNavigation);
        return () => window.removeEventListener("keydown", handleNavigation);
    }, [isOpen, selectedIndex, allCommands, router]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[60vh]"
                >
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                        <Search className="h-5 w-5 text-slate-400" />
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Ne yapmak istiyorsunuz?"
                            className="flex-1 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
                        />
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</span>
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto">
                        {allCommands.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-sm">
                                Sonuç bulunamadı.
                            </div>
                        ) : (
                            <>
                                <div className="text-[10px] uppercase font-bold text-slate-400 px-4 py-2">Önerilenler</div>
                                {allCommands.map((cmd, index) => (
                                    <CommandItem
                                        key={cmd.label}
                                        icon={cmd.icon}
                                        label={cmd.label}
                                        onClick={() => {
                                            if (cmd.type === "nav" && 'href' in cmd) {
                                                router.push(cmd.href as string);
                                            } else if (cmd.type === "action" && 'action' in cmd) {
                                                (cmd.action as () => void)();
                                            }
                                            setIsOpen(false);
                                        }}
                                        selected={index === selectedIndex}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                            <Command className="h-3 w-3" />
                            <span>Komut Paleti</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Seçmek için</span>
                            <span className="font-bold text-slate-500">↵</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Separate component for the trigger button to be used in UI
export function CommandPaletteTrigger() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Dispatch custom event to open palette
    const openPalette = () => {
        window.dispatchEvent(new KeyboardEvent("keydown", {
            key: "k",
            metaKey: true
        }));
    };

    if (!mounted) return null;

    return (
        <button
            onClick={openPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500 text-xs font-medium border border-slate-200"
        >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ara...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white px-1 rounded border border-slate-300 text-slate-400">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>
    );
}
