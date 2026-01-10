"use client";

import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp } from "lucide-react";

interface LevelCardProps {
    points: number;
}

export default function LevelCard({ points }: LevelCardProps) {
    const level = Math.floor(points / 100) + 1;
    const progress = points % 100;
    const nextLevelPoints = level * 100;
    const pointsNeeded = 100 - progress;

    return (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-0.5 shadow-lg">
            <div className="bg-slate-900/10 rounded-[14px] p-4 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                            <span className="text-xl font-black text-white">{level}</span>
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">Mevcut Seviye</p>
                            <h3 className="text-lg font-bold">Profesyonel</h3>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-yellow-300 font-bold">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{points} XP</span>
                        </div>
                        <p className="text-[10px] text-indigo-200">Toplam Puan</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-indigo-100 font-medium">
                        <span>İlerleme</span>
                        <span>{progress}/100 XP</span>
                    </div>
                    <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        />
                    </div>
                    <p className="text-[10px] text-indigo-200 text-center mt-2">
                        Sonraki seviyeye <span className="text-white font-bold">{pointsNeeded} XP</span> kaldı
                    </p>
                </div>
            </div>
        </div>
    );
}
