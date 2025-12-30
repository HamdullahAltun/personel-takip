"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Users, Trash } from "lucide-react";

type Shift = {
    id: string;
    userId: string;
    user: { name: string };
    start: string;
    end: string;
    title?: string;
    color?: string;
};

type User = {
    id: string;
    name: string;
};

export default function ShiftsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [userId, setUserId] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [title, setTitle] = useState("");
    const [color, setColor] = useState("blue");

    useEffect(() => {
        fetchShifts();
        fetchUsers();
    }, [currentDate]);

    const fetchShifts = async () => {
        const start = startOfWeek(startOfMonth(currentDate)).toISOString();
        const end = endOfWeek(endOfMonth(currentDate)).toISOString();
        const res = await fetch(`/api/shifts?start=${start}&end=${end}`);
        if (res.ok) setShifts(await res.json());
        setLoading(false);
    };

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const res = await fetch('/api/shifts', {
            method: 'POST',
            body: JSON.stringify({
                userId,
                date: dateStr,
                startTime,
                endTime,
                title,
                color
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setShowModal(false);
            fetchShifts();
            // Reset crucial fields, keep times
            setTitle("");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Vardiyayı silmek istiyor musunuz?")) return;
        setShifts(prev => prev.filter(s => s.id !== id));
        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
    };

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    });

    const getColorClass = (c: string) => {
        switch (c) {
            case 'red': return 'bg-red-100 text-red-700 border-red-200';
            case 'green': return 'bg-green-100 text-green-700 border-green-200';
            case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'purple': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-600" />
                        Vardiya Planı
                    </h1>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="w-32 text-center font-semibold text-slate-700">{format(currentDate, 'MMMM yyyy', { locale: tr })}</span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
                <div>
                    {/* Legend or Actions */}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                            <div key={d} className="p-3 text-sm font-semibold text-slate-500 text-center border-r border-slate-200 last:border-r-0">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                        {days.map(day => {
                            const dayShifts = shifts.filter(s => isSameDay(new Date(s.start), day));
                            // Sort by start time?

                            return (
                                <div
                                    key={day.toString()}
                                    className={`min-h-[120px] border-b border-r border-slate-100 p-2 hover:bg-slate-50 transition-colors group cursor-pointer ${!isSameMonth(day, currentDate) ? 'bg-slate-50/50' : ''}`}
                                    onClick={() => { setSelectedDate(day); setShowModal(true); }}
                                >
                                    <div className={`text-right mb-1 ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center ml-auto shadow-sm' : 'text-slate-500'}`}>
                                        <span className="text-sm font-medium">{format(day, 'd')}</span>
                                    </div>

                                    <div className="space-y-1">
                                        {dayShifts.map(shift => (
                                            <div key={shift.id} className={`text-[10px] p-1.5 rounded border ${getColorClass(shift.color || 'blue')} flex justify-between items-center group/shift shadow-sm`}>
                                                <div className="truncate">
                                                    <span className="font-bold block">{shift.user.name}</span>
                                                    <span className="opacity-90">{format(new Date(shift.start), 'HH:mm')} - {format(new Date(shift.end), 'HH:mm')}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDelete(e, shift.id)}
                                                    className="opacity-0 group-hover/shift:opacity-100 hover:text-red-600 transition"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full mt-2 opacity-0 group-hover:opacity-100 text-indigo-500 text-xs font-bold py-1 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center gap-1 transition">
                                        <Plus className="h-3 w-3" /> Ekle
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedDate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Vardiya Ekle: {format(selectedDate, 'd MMMM yyyy', { locale: tr })}</h2>
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 p-1.5 rounded-full hover:bg-slate-200"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    required
                                    value={userId}
                                    onChange={e => setUserId(e.target.value)}
                                >
                                    <option value="">Seçiniz</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç</label>
                                    <input type="time" className="w-full border p-2 rounded-lg" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş</label>
                                    <input type="time" className="w-full border p-2 rounded-lg" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Etiket (Opsiyonel)</label>
                                <input type="text" className="w-full border p-2 rounded-lg" placeholder="Örn: Sabah Vardiyası" value={title} onChange={e => setTitle(e.target.value)} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Renk</label>
                                <div className="flex gap-2">
                                    {['blue', 'red', 'green', 'orange', 'purple'].map(c => (
                                        <button
                                            key={c} type="button"
                                            onClick={() => setColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-black scale-110' : 'border-transparent'} bg-${c}-500`}
                                            style={{ backgroundColor: c === 'blue' ? '#3b82f6' : c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : c === 'orange' ? '#f97316' : '#a855f7' }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 mt-2">
                                Oluştur
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
