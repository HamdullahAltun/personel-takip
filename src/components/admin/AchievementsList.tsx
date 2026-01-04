"use client";

import { Trash2, Trophy, Star, Medal, ThumbsUp, Zap, LucideIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Define props based on the Prisma schema relation
type Achievement = {
    id: string;
    title: string;
    description: string | null;
    icon: string;
    date: Date;
};

const ICONS: Record<string, LucideIcon> = {
    star: Star,
    trophy: Trophy,
    medal: Medal,
    thumbsUp: ThumbsUp,
    zap: Zap
};

export default function AchievementsList({ achievements }: { achievements: Achievement[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Başarımı silmek istiyor musunuz?")) return;
        setLoading(true);
        await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
        setLoading(false);
        router.refresh();
    };

    const getIcon = (name: string) => {
        const Icon = ICONS[name] || Star;
        return <Icon className="h-5 w-5 text-yellow-600" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Başarımlar
                </h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    Toplam: {achievements.length}
                </span>
            </div>

            <div className="divide-y divide-slate-100">
                {achievements.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                        Henüz başarım eklenmemiş.
                    </div>
                ) : (
                    achievements.map(ach => (
                        <div key={ach.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition">
                            <div className="bg-yellow-100 p-3 rounded-full">
                                {getIcon(ach.icon)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-sm">{ach.title}</h4>
                                <p className="text-slate-500 text-xs">{ach.description}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {new Date(ach.date).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(ach.id)}
                                disabled={loading}
                                className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
