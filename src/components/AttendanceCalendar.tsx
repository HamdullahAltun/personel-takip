"use client";

import { AttendanceRecord } from "@prisma/client";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AttendanceCalendar({ records }: { records: AttendanceRecord[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Helper: Calculate hours worked for a specific day
    const getDailyStats = (day: Date) => {
        const dayRecords = records.filter(r => isSameDay(new Date(r.timestamp), day));

        let workedHours = 0;
        let checkInTime = null;
        let checkOutTime = null;

        // Sort by time
        dayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Simple pairing logic: IN -> OUT
        for (let i = 0; i < dayRecords.length; i++) {
            const r = dayRecords[i];
            if (r.type === 'CHECK_IN') {
                if (!checkInTime) checkInTime = r.timestamp; // First IN
                // Look ahead for next OUT
                const nextType = dayRecords[i + 1]?.type;
                if (nextType === 'CHECK_OUT') {
                    const nextTime = dayRecords[i + 1].timestamp;
                    workedHours += (new Date(nextTime).getTime() - new Date(r.timestamp).getTime()) / (1000 * 60 * 60);
                    checkOutTime = nextTime; // Last OUT
                    i++; // Skip next
                }
            } else if (r.type === 'CHECK_OUT') {
                checkOutTime = r.timestamp;
            }
        }

        return {
            workedHours: workedHours > 0 ? workedHours.toFixed(1) : null,
            checkIn: checkInTime ? format(new Date(checkInTime), "HH:mm") : null,
            checkOut: checkOutTime ? format(new Date(checkOutTime), "HH:mm") : null,
            hasRecord: dayRecords.length > 0
        };
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Padding for start of month
    const startDay = getDay(monthStart); // 0 (Sun) - 6 (Sat)
    // Adjust for Monday start (Turkish standard): 0->6, 1->0, ...
    const paddingDays = startDay === 0 ? 6 : startDay - 1;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 capitalize">
                    {format(currentDate, "MMMM yyyy", { locale: tr })}
                </h3>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
                        <ChevronLeft className="h-5 w-5 text-slate-500" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
                        <ChevronRight className="h-5 w-5 text-slate-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 text-xs font-semibold text-slate-400 border-b border-slate-100 bg-slate-50">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                    <div key={d} className="py-2 text-center">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: paddingDays }).map((_, i) => (
                    <div key={`pad-${i}`} className="h-24 bg-slate-50/30 border-b border-r border-slate-100" />
                ))}

                {daysInMonth.map(day => {
                    const stats = getDailyStats(day);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={day.toISOString()} className={`h-24 border-b border-r border-slate-100 p-1 flex flex-col ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <span className={`text-xs ml-auto mb-1 ${isToday ? 'bg-blue-600 text-white px-1.5 rounded-full' : 'text-slate-400'}`}>
                                {format(day, "d")}
                            </span>

                            {stats.hasRecord && (
                                <div className="flex-1 flex flex-col justify-center gap-1">
                                    {stats.workedHours && (
                                        <div className="bg-green-100 text-green-700 text-[10px] font-bold px-1 py-0.5 rounded text-center">
                                            {stats.workedHours} sa.
                                        </div>
                                    )}
                                    <div className="flex justify-between px-1 text-[9px] text-slate-500">
                                        <span>{stats.checkIn || '-'}</span>
                                        <span>{stats.checkOut || '-'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
