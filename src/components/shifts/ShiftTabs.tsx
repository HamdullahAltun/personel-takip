"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
    activeTab: 'MY_SHIFTS' | 'MARKETPLACE';
    onChange: (tab: 'MY_SHIFTS' | 'MARKETPLACE') => void;
}

export default function ShiftTabs({ activeTab, onChange }: TabsProps) {
    return (
        <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
            <button
                onClick={() => onChange('MY_SHIFTS')}
                className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                    activeTab === 'MY_SHIFTS'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                Vardiyalarım
            </button>
            <button
                onClick={() => onChange('MARKETPLACE')}
                className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                    activeTab === 'MARKETPLACE'
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                )}
            >
                Takas Pazarı
            </button>
        </div>
    );
}
