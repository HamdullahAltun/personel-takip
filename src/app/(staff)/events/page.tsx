"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";

export default function StaffEventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data);
    };

    // Calendar Generation
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getTypeColor = (type: string) => {
        if (type === 'HOLIDAY') return 'bg-red-100 text-red-700 border-red-200';
        if (type === 'SOCIAL') return 'bg-purple-100 text-purple-700 border-purple-200';
        if (type === 'BIRTHDAY') return 'bg-pink-100 text-pink-700 border-pink-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Etkinlik Takvimi</h1>
                    <p className="text-slate-500">Şirket etkinlikleri, tatiller ve toplantılar</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="bg-white border p-2 rounded-lg hover:bg-slate-50">Savedi</button>
                    <button onClick={() => setCurrentDate(new Date())} className="bg-white border px-4 py-2 rounded-lg font-bold hover:bg-slate-50">Bugün</button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="bg-white border p-2 rounded-lg hover:bg-slate-50">Sonraki</button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header Days */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                        <div key={d} className="p-3 text-center text-sm font-bold text-slate-500">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                    {calendarDays.map(day => {
                        const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                        const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));

                        return (
                            <div key={day.toString()} className={`min-h-[120px] p-2 border-b border-r border-slate-100 relative group
                                ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'}
                            `}>
                                <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                                    {format(day, 'd')}
                                </span>

                                <div className="mt-2 space-y-1">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className={`text-xs p-1.5 rounded border mb-1 truncate ${getTypeColor(event.type)}`}>
                                            <span className="font-bold">{format(new Date(event.date), 'HH:mm')}</span> {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
