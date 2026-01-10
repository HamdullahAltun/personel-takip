"use client";



import { Shift } from "@prisma/client";
import { CalendarClock, Clock } from "lucide-react";
import { format, isSameDay, startOfWeek, addDays, startOfToday } from "date-fns";
import { tr } from "date-fns/locale";

export default function ScheduleWidget({ shifts }: { shifts: Shift[] }) {
    // If no shifts, maybe don't show or show empty state? Let's show empty state.

    const today = startOfToday();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-indigo-500" />
                Haftalık Programım
            </h3>

            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => {
                    const dayShifts = shifts?.filter(s => isSameDay(new Date(s.startTime), day));
                    const isToday = isSameDay(day, today);

                    return (
                        <div key={i} className={`flex flex-col items-center p-1 rounded-xl transition-colors ${isToday ? 'bg-indigo-50/50' : ''}`}>
                            <span className={`text-[10px] font-bold mb-1 uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {format(day, 'EEE', { locale: tr })}
                            </span>

                            {dayShifts && dayShifts.length > 0 ? (
                                <div className="w-full space-y-1">
                                    {dayShifts.map(shift => (
                                        <div key={shift.id} className={`w-full rounded-lg p-1 text-center border flex flex-col justify-center min-h-[3rem] relative overflow-hidden group ${shift.type === 'OVERTIME' || shift.isOvertime
                                            ? 'bg-amber-50 border-amber-100 text-amber-700'
                                            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                            }`}>
                                            <span className="text-[10px] font-bold">{format(new Date(shift.startTime), 'HH:mm')}</span>
                                            <div className={`h-px w-full my-0.5 ${shift.isOvertime ? 'bg-amber-200' : 'bg-indigo-200'}`}></div>
                                            <span className="text-[10px] font-bold">{format(new Date(shift.endTime), 'HH:mm')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full bg-slate-50 rounded-lg p-1 text-center border border-slate-100 flex flex-col justify-center min-h-[3rem] opacity-50">
                                    <span className="text-[10px] font-bold text-slate-400">-</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
