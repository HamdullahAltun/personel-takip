"use client";

import { Trophy, Star } from 'lucide-react';

type EOMData = {
    user: {
        name: string;
    };
    note: string | null;
    month: number;
    year: number;
};

export default function EOMWidget({ data }: { data: EOMData | null }) {
    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-20">
                <Trophy className="h-24 w-24" />
            </div>
            <div className="flex items-center gap-2 mb-3 bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-md">
                <Star className="h-3 w-3 text-yellow-100" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-50">Ayın Personeli</span>
            </div>

            <p className="text-yellow-100 text-xs mb-1">
                {new Date().toLocaleString('tr-TR', { month: 'long' })} Ayı Kazananı
            </p>
            <h3 className="font-bold text-2xl leading-tight mb-2">{data.user.name}</h3>
            {data.note && (
                <p className="text-yellow-50 text-xs italic opacity-90 line-clamp-2">
                    "{data.note}"
                </p>
            )}
        </div>
    );
}
