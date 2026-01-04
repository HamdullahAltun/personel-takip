"use client";

import { WorkSchedule } from "@prisma/client";
import { CalendarClock } from "lucide-react";

export default function ScheduleWidget({ schedules }: { schedules: WorkSchedule[] }) {
    if (!schedules || schedules.length === 0) return null;

    const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    // Sort schedules by dayOfWeek (1-7)
    const sorted = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    // Create full week array
    const fullWeek = Array.from({ length: 7 }, (_, i) => {
        const day = i + 1;
        const schedule = sorted.find(s => s.dayOfWeek === day);
        return schedule || null;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-indigo-500" />
                Çalışma Saatlerim
            </h3>

            <div className="grid grid-cols-7 gap-1">
                {fullWeek.map((s, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 uppercase">{DAYS[i]}</span>
                        {s && !s.isOffDay ? (
                            <div className="w-full bg-indigo-50 rounded-lg p-1 text-center border border-indigo-100 flex flex-col justify-center h-16">
                                <span className="text-[10px] font-bold text-slate-800">{s.startTime}</span>
                                <div className="h-px bg-indigo-200 w-full my-0.5"></div>
                                <span className="text-[10px] font-bold text-slate-600">{s.endTime}</span>
                            </div>
                        ) : (
                            <div className="w-full bg-slate-50 rounded-lg p-1 text-center border border-slate-100 flex flex-col justify-center h-16 opacity-50">
                                <span className="text-[10px] font-bold text-slate-400">TATİL</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
