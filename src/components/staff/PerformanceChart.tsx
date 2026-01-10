"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { tr } from "date-fns/locale";
import { format } from "date-fns";

interface PerformanceChartProps {
    data: {
        date: string;
        score: number;
    }[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
    if (!data || data.length === 0) return null;

    const formattedData = data.map(item => ({
        ...item,
        dateFormatted: format(new Date(item.date), 'MMM yyyy', { locale: tr })
    }));

    return (
        <div className="w-full h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedData}>
                    <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="dateFormatted"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        dy={10}
                    />
                    <YAxis
                        hide
                        domain={[0, 100]}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl">
                                        <p className="font-bold mb-1">{payload[0].payload.dateFormatted}</p>
                                        <p className="text-indigo-300">Puan: <span className="text-white font-bold">{payload[0].value}</span></p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
