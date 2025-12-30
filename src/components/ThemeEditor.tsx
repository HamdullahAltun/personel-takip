"use client";

import { useState } from "react";
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
    { name: "Indigo", value: "#4f46e5" },
    { name: "Rose", value: "#e11d48" },
    { name: "Emerald", value: "#10b981" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Violet", value: "#8b5cf6" },
];

export default function ThemeEditor() {
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const [saving, setSaving] = useState(false);

    const saveSettings = async (newTheme: string, newColor: string) => {
        setSaving(true);
        try {
            await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ theme: newTheme, accentColor: newColor })
            });
        } catch (e) {
            console.error(e);
        }
        setSaving(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-600" />
                Görünüm Ayarları
            </h3>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Tema Modu</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: "LIGHT", icon: Sun, label: "Açık" },
                            { id: "DARK", icon: Moon, label: "Koyu" },
                            { id: "SYSTEM", icon: Monitor, label: "Sistem" },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setTheme(t.id as any);
                                    saveSettings(t.id, accentColor);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2",
                                    theme === t.id
                                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm"
                                        : "border-slate-100 hover:border-slate-200 text-slate-500"
                                )}
                            >
                                <t.icon className="h-5 w-5" />
                                <span className="text-[10px] font-bold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Vurgu Rengi</label>
                    <div className="flex flex-wrap gap-3">
                        {ACCENT_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    setAccentColor(color.value);
                                    saveSettings(theme, color.value);
                                }}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90 relative",
                                    accentColor === color.value && "ring-2 ring-offset-2 ring-slate-400"
                                )}
                                style={{ backgroundColor: color.value }}
                            >
                                {accentColor === color.value && <Check className="w-5 h-5 text-white" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {saving && (
                <div className="text-[10px] text-slate-400 italic animate-pulse">
                    Değişiklikler kaydediliyor...
                </div>
            )}
        </div>
    );
}
