"use client";

import { Shift } from "@prisma/client";
import { CalendarClock, Clock, Sparkles } from "lucide-react";
import { format, isSameDay, startOfWeek, addDays, startOfToday } from "date-fns";
import { tr } from "date-fns/locale";

export default function ScheduleWidget({ shifts }: { shifts: Shift[] }) {
    const today = startOfToday();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    return (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <CalendarClock className="h-5 w-5" />
                    </div>
                    Haftalık Programım
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    Aktif Hafta
                </div>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, i) => {
                        const dayShifts = shifts?.filter(s => isSameDay(new Date(s.startTime), day));
                        const isToday = isSameDay(day, today);

                        return (
                            <div key={i} className="flex flex-col gap-2">
                                <div className={`flex flex-col items-center py-2 rounded-xl transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}>
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isToday ? 'text-white/80' : 'text-slate-400'}`}>
                                        {format(day, 'EEE', { locale: tr })}
                                    </span>
                                    <span className="text-sm font-black">
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                <div className="space-y-1.5 min-h-[8rem]">
                                    {dayShifts && dayShifts.length > 0 ? (
                                        dayShifts.map(shift => (
                                            <div key={shift.id} className={`group relative p-2 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95 ${shift.isOvertime
                                                ? 'bg-amber-50 border-amber-100 text-amber-700'
                                                : 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
                                                }`}>
                                                <span className="text-[10px] font-black">{format(new Date(shift.startTime), 'HH:mm')}</span>
                                                <div className={`h-0.5 w-4 rounded-full ${shift.isOvertime ? 'bg-amber-200' : 'bg-indigo-200'}`}></div>
                                                <span className="text-[10px] font-black">{format(new Date(shift.endTime), 'HH:mm')}</span>

                                                {shift.isOvertime && (
                                                    <div className="absolute -top-1 -right-1 flex">
                                                        <span className="flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100 opacity-30">
                                            <span className="text-xs font-black text-slate-300">-</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mesai</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
