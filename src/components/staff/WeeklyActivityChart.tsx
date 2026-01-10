"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useState, useEffect } from 'react';

type WeeklyActivityData = {
    day: string;
    hours: number;
    fullDate: string;
};

export default function WeeklyActivityChart({ data }: { data: WeeklyActivityData[] | undefined }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Skeleton Loading
    if (!data) {
        return (
            <div className="h-64 sm:h-72 w-full bg-slate-50/50 rounded-2xl animate-pulse flex items-end justify-between p-6 gap-2">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-full bg-slate-200 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                ))}
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs">
                    <p className="font-bold mb-1">{label}</p>
                    <p className="font-medium text-emerald-300">{payload[0].value} Saat</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-64 sm:h-72">
            {!isMounted ? (
                // Render static placeholder to prevent hydration mismatch or heavy loading on initial render
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">Yükleniyor...</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                            dy={10}
                        />
                        <YAxis
                            hide
                            domain={[0, 'dataMax + 2']}
                        />
                        <Tooltip cursor={{ fill: '#f1f5f9', radius: 8 }} content={<CustomTooltip />} />
                        <ReferenceLine y={9} stroke="#e2e8f0" strokeDasharray="3 3" label={{ position: 'right', value: 'Hedef (9s)', fill: '#cbd5e1', fontSize: 10 }} />
                        <Bar dataKey="hours" radius={[8, 8, 8, 8]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.hours >= 9 ? '#10b981' : '#6366f1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
