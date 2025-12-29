"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);

    // Form
    const [formData, setFormData] = useState({ title: "", date: new Date().toISOString().split('T')[0], description: "", type: "MEETING" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/events', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ title: "", date: new Date().toISOString().split('T')[0], description: "", type: "MEETING" });
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Etkinliği silmek istediğinize emin misiniz?")) return;
        await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
        fetchData();
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
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Etkinlik Ekle
                    </button>
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
                                        <div key={event.id} className={`text-xs p-1.5 rounded border mb-1 truncate cursor-pointer hover:opacity-80 transition relative group/event ${getTypeColor(event.type)}`}>
                                            <span className="font-bold">{format(new Date(event.date), 'HH:mm')}</span> {event.title}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                                                className="absolute right-1 top-1 hidden group-hover/event:block bg-white p-0.5 rounded-full text-red-500"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Etkinlik</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Örn: Yılbaşı Partisi" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                                    <input type="datetime-local" required className="w-full border rounded-lg p-2"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="MEETING">Toplantı</option>
                                        <option value="HOLIDAY">Tatil</option>
                                        <option value="SOCIAL">Etkinlik/Parti</option>
                                        <option value="BIRTHDAY">Doğum Günü</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                                <textarea required className="w-full border rounded-lg p-2 h-20" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
