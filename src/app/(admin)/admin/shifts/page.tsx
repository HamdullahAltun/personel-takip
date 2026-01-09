"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, X, Users, Trash, BrainCircuit, CalendarCheck, Clock, List, Calendar as CalendarIcon, Filter, MapPin } from "lucide-react";

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

type AttendanceRecord = {
    id: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    timestamp: string;
    method: string;
    isLate: boolean;
    user: {
        name: string;
        role: string;
    };
};

export default function ShiftsPage() {
    const [activeTab, setActiveTab] = useState<'PLAN' | 'RECORDS'>('PLAN');

    // --- SHIFTS STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [trades, setTrades] = useState<any[]>([]);

    // Shift Form
    const [userId, setUserId] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [title, setTitle] = useState("");
    const [color, setColor] = useState("blue");

    // --- ATTENDANCE STATE ---
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [recordLoading, setRecordLoading] = useState(false);
    const [filterDate, setFilterDate] = useState("");
    const [filterUser, setFilterUser] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'PLAN') {
            fetchShifts();
            fetchTrades();
        } else {
            fetchRecords();
        }
    }, [currentDate, activeTab, filterDate, filterUser]);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    };

    // --- SHIFT FUNCTIONS ---
    const fetchTrades = async () => {
        const res = await fetch('/api/shifts/trade');
        if (res.ok) setTrades(await res.json());
    };

    const handleTradeAction = async (tradeId: string, action: 'APPROVE' | 'REJECT') => {
        const res = await fetch('/api/shifts/trade', {
            method: 'PATCH',
            body: JSON.stringify({ tradeId, action }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            fetchTrades();
            fetchShifts();
        }
    };

    const fetchShifts = async () => {
        setLoading(true);
        const start = startOfWeek(startOfMonth(currentDate)).toISOString();
        const end = endOfWeek(endOfMonth(currentDate)).toISOString();
        const res = await fetch(`/api/shifts?start=${start}&end=${end}`);
        if (res.ok) setShifts(await res.json());
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        const res = await fetch('/api/shifts', {
            method: 'POST',
            body: JSON.stringify({ userId, date: dateStr, startTime, endTime, title, color }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setShowModal(false);
            fetchShifts();
            setTitle("");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Vardiyayı silmek istiyor musunuz?")) return;
        setShifts(prev => prev.filter(s => s.id !== id));
        await fetch(`/api/shifts?id=${id}`, { method: 'DELETE' });
    };

    // --- ATTENDANCE FUNCTIONS ---
    const fetchRecords = async () => {
        setRecordLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterDate) params.append('date', filterDate);
            if (filterUser) params.append('userId', filterUser);

            const res = await fetch(`/api/attendance?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRecords(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            setRecords([]);
        } finally {
            setRecordLoading(false);
        }
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
            {/* Header & Tabs */}
            <div className="p-4 flex flex-col gap-4 border-b border-slate-200 bg-white z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarCheck className="h-6 w-6 text-indigo-600" />
                        Mesai & Vardiya Yönetimi
                    </h1>

                    {activeTab === 'PLAN' && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    if (!confirm("Önümüzdeki 7 gün için otomatik vardiya planı oluşturulsun mu?")) return;
                                    const btn = document.getElementById('ai-plan-btn');
                                    if (btn) btn.innerText = "Planlanıyor...";
                                    const res = await fetch("/api/admin/shifts/auto-plan", {
                                        method: "POST",
                                        body: JSON.stringify({ startDate: new Date().toISOString() })
                                    });
                                    if (res.ok) fetchShifts();
                                    if (btn) btn.innerText = "Akıllı Planla (AI)";
                                }}
                                id="ai-plan-btn"
                                className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition shadow-sm"
                            >
                                <BrainCircuit className="h-4 w-4 text-indigo-400" />
                                Akıllı Planla (AI)
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('PLAN')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'PLAN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Vardiya Planı
                    </button>
                    <button
                        onClick={() => setActiveTab('RECORDS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'RECORDS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        <List className="h-4 w-4" />
                        Mesai Kayıtları
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-hidden flex flex-col relative w-full h-full">

                {activeTab === 'PLAN' ? (
                    <>
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-center items-center gap-4">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronLeft className="h-4 w-4" /></button>
                            <span className="w-32 text-center font-bold text-slate-700">{format(currentDate, 'MMMM yyyy', { locale: tr })}</span>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronRight className="h-4 w-4" /></button>
                        </div>

                        {trades.length > 0 && (
                            <div className="bg-amber-50 border-b border-amber-100 p-3 shrink-0">
                                <h3 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    Bekleyen Takaslar ({trades.length})
                                </h3>
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {trades.map((trade: any) => (
                                        <div key={trade.id} className="min-w-[260px] bg-white p-2 rounded-lg border border-amber-200 shadow-sm flex flex-col gap-1.5">
                                            <div className="text-[10px] text-slate-500">
                                                <span className="font-bold text-slate-900">{trade.requester.name}</span> ➡️ <span className="font-bold text-slate-900">{trade.recipient.name}</span>
                                            </div>
                                            <div className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                                {format(new Date(trade.shift.start), 'd MMM HH:mm')}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTradeAction(trade.id, 'APPROVE')} className="flex-1 bg-green-600 text-white text-[10px] py-1 rounded hover:bg-green-700 font-bold">Onayla</button>
                                                <button onClick={() => handleTradeAction(trade.id, 'REJECT')} className="flex-1 bg-slate-200 text-slate-700 text-[10px] py-1 rounded hover:bg-slate-300 font-bold">Red</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                        return (
                                            <div
                                                key={day.toString()}
                                                className={`min-h-[100px] border-b border-r border-slate-100 p-2 hover:bg-slate-50 transition-colors group cursor-pointer ${!isSameMonth(day, currentDate) ? 'bg-slate-50/50' : ''}`}
                                                onClick={() => { setSelectedDate(day); setShowModal(true); }}
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
                                                onDragLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                                                onDrop={async (e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.style.backgroundColor = '';
                                                    const shiftId = e.dataTransfer.getData("shiftId");
                                                    if (!shiftId) return;

                                                    const shift = shifts.find(s => s.id === shiftId);
                                                    if (!shift) return;

                                                    // Calculate new start/end times preserving duration and time of day
                                                    const oldStart = new Date(shift.start);
                                                    const oldEnd = new Date(shift.end);
                                                    const durationMs = oldEnd.getTime() - oldStart.getTime();

                                                    const newStart = new Date(day);
                                                    newStart.setHours(oldStart.getHours(), oldStart.getMinutes());

                                                    const newEnd = new Date(newStart.getTime() + durationMs);

                                                    // Optimistic UI Update
                                                    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, start: newStart.toISOString(), end: newEnd.toISOString() } : s));

                                                    // API Call
                                                    await fetch('/api/shifts', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: shiftId,
                                                            start: newStart.toISOString(),
                                                            end: newEnd.toISOString()
                                                        })
                                                    });
                                                }}
                                            >
                                                <div className={`text-right mb-1 ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center ml-auto shadow-sm' : 'text-slate-500'}`}>
                                                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {dayShifts.map(shift => (
                                                        <div
                                                            key={shift.id}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData("shiftId", shift.id);
                                                                e.stopPropagation();
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`text-[10px] p-1.5 rounded border ${getColorClass(shift.color || 'blue')} flex justify-between items-center group/shift shadow-sm cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform`}
                                                        >
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
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* RECORDS TAB */
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <select
                                    className="text-sm bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
                                    value={filterUser}
                                    onChange={e => setFilterUser(e.target.value)}
                                >
                                    <option value="">Tüm Personel</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <CalendarIcon className="h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    className="text-sm bg-transparent outline-none font-medium text-slate-700 cursor-pointer"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate("")} className="ml-2 hover:bg-slate-100 p-1 rounded-full"><X className="h-3 w-3 text-slate-400" /></button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">Personel</th>
                                        <th className="p-4">Hareket</th>
                                        <th className="p-4">Zaman</th>
                                        <th className="p-4">Konum/Yöntem</th>
                                        <th className="p-4">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recordLoading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">Yükleniyor...</td></tr>
                                    ) : records.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                                    ) : (
                                        records.map((rec) => (
                                            <tr key={rec.id} className="hover:bg-slate-50 transition">
                                                <td className="p-4 font-bold text-slate-900">{rec.user.name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 ${rec.type === 'CHECK_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${rec.type === 'CHECK_IN' ? 'bg-green-600' : 'bg-red-600'}`} />
                                                        {rec.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 tabular-nums font-medium">
                                                    {format(new Date(rec.timestamp), "d MMM yyyy, HH:mm", { locale: tr })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded w-fit">
                                                        <MapPin className="h-3 w-3" />
                                                        {rec.method}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {rec.isLate ? (
                                                        <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded animate-pulse">GEÇ KALDI</span>
                                                    ) : (
                                                        <span className="text-green-600 text-xs font-bold">ZAMANINDA</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {
                showModal && selectedDate && (
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
                )
            }
        </div >
    );
}
