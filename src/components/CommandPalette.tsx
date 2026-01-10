"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Command, User, Calendar, Award, Home, TrendingUp, Smile, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const routes = [
        { name: "Ana Sayfa", icon: <Home className="w-4 h-4" />, path: "/dashboard", section: "Navigasyon" },
        { name: "Profilim", icon: <User className="w-4 h-4" />, path: "/profile", section: "Navigasyon" },
        { name: "Performans", icon: <TrendingUp className="w-4 h-4" />, path: "/performance", section: "Navigasyon" },
        { name: "Sosyal", icon: <Smile className="w-4 h-4" />, path: "/social", section: "Navigasyon" },
        { name: "Yeni Hedef Ekle", icon: <Zap className="w-4 h-4" />, path: "/performance?action=new-goal", section: "Hızlı İşlemler" },
        { name: "Kudos Gönder", icon: <Award className="w-4 h-4" />, path: "/social?action=kudos", section: "Hızlı İşlemler" },
    ];

    const filteredItems = routes.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (path: string) => {
        setOpen(false);
        router.push(path);
        setSearch("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 gap-0 sm:max-w-xl bg-white overflow-hidden shadow-2xl border-0">
                <div className="flex items-center px-4 py-4 border-b border-slate-100">
                    <Search className="w-5 h-5 text-slate-400 mr-2" />
                    <input
                        className="flex-1 text-lg bg-transparent border-none outline-none placeholder:text-slate-400 text-slate-800"
                        placeholder="Komut yazın veya arama yapın..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="hidden sm:flex text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">ESC</div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredItems.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Sonuç bulunamadı.</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item, index) => (
                                <motion.button
                                    key={index}
                                    layout
                                    onClick={() => handleSelect(item.path)}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-left group transition-colors focus:bg-slate-100 focus:outline-none"
                                >
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        {item.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold">{item.section}</div>
                                    </div>
                                    <Command className="w-3 h-3 text-slate-300 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium">
                        <span className="font-bold">Pro Tip:</span> Hızlı erişim için <kbd className="bg-white border rounded px-1 font-mono">⌘K</kbd> kullanın
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
