"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, List, History } from "lucide-react";

type Shift = {
    id: string;
    user: { name: string };
    start: string;
    end: string;
    title?: string;
    color?: string;
};

type AttendanceRecord = {
    id: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    timestamp: string;
    method: string;
    isLate: boolean;
};

export default function StaffShiftsPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'MY_SHIFTS' | 'MARKET' | 'HISTORY'>('MY_SHIFTS');
    const [marketTrades, setMarketTrades] = useState<any[]>([]);
    const [history, setHistory] = useState<AttendanceRecord[]>([]);

    useEffect(() => {
        if (activeTab === 'MY_SHIFTS') fetchShifts();
        if (activeTab === 'MARKET') fetchMarket();
        if (activeTab === 'HISTORY') fetchHistory();
    }, [currentDate, activeTab]);

    const fetchShifts = async () => {
        const start = startOfWeek(startOfMonth(currentDate)).toISOString();
        const end = endOfWeek(endOfMonth(currentDate)).toISOString();
        const res = await fetch(`/api/shifts?start=${start}&end=${end}`);
        if (res.ok) setShifts(await res.json());
        setLoading(false);
    };

    const fetchMarket = async () => {
        const res = await fetch('/api/shifts/market');
        if (res.ok) setMarketTrades(await res.json());
    };

    const fetchHistory = async () => {
        const res = await fetch('/api/attendance');
        if (res.ok) setHistory(await res.json());
    };

    const handleTradePost = async (shiftId: string) => {
        if (!confirm('Bu vardiyayı takas pazarına eklemek istiyor musunuz?')) return;
        try {
            const res = await fetch('/api/shifts/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shiftId })
            });
            if (res.ok) {
                alert('Vardiya pazara eklendi!');
                fetchShifts();
            } else {
                const d = await res.json();
                alert(d.error);
            }
        } catch (e) { alert('Hata oluştu'); }
    };

    const handleTakeShift = async (tradeId: string) => {
        if (!confirm('Bu vardiyayı almak istiyor musunuz?')) return;
        try {
            const res = await fetch('/api/shifts/trade', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId })
            });
            if (res.ok) {
                alert('Talep iletildi. Yönetici onayı bekleniyor.');
                fetchMarket();
            } else {
                const d = await res.json();
                alert(d.error);
            }
        } catch (e) { alert('Hata oluştu'); }
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
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-lg mx-auto pb-20">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Vardiya & Mesai</h1>
                        <p className="text-xs text-slate-500">Planlama, Takas ve Kayıtlar</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 mb-4 px-2">
                <button onClick={() => setActiveTab('MY_SHIFTS')} className={`flex-1 py-2 font-bold text-xs rounded-xl transition-colors ${activeTab === 'MY_SHIFTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200'}`}>Takvim</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 py-2 font-bold text-xs rounded-xl transition-colors ${activeTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200'}`}>Geçmiş</button>
                <button onClick={() => setActiveTab('MARKET')} className={`flex-1 py-2 font-bold text-xs rounded-xl transition-colors ${activeTab === 'MARKET' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200'}`}>Pazar</button>
            </div>

            {activeTab === 'MY_SHIFTS' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-full shadow-sm transition"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="font-bold text-slate-800">{format(currentDate, 'MMMM yyyy', { locale: tr })}</span>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-full shadow-sm transition"><ChevronRight className="h-4 w-4" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {days.map(day => {
                            const dayShifts = shifts.filter(s => isSameDay(new Date(s.start), day));
                            if (dayShifts.length === 0) return null;

                            return (
                                <div key={day.toString()} className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`text-xs font-bold px-2 py-1 rounded ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            {format(day, 'd MMM EEEE', { locale: tr })}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {dayShifts.map(shift => (
                                            <div key={shift.id} className={`p-2 rounded-lg border flex justify-between items-center ${getColorClass(shift.color || 'blue')} relative group`}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold text-slate-700">
                                                        {shift.user.name[0]}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-bold block leading-none">{shift.user.name}</span>
                                                        <span className="text-[10px] opacity-80">{format(new Date(shift.start), 'HH:mm')} - {format(new Date(shift.end), 'HH:mm')}</span>
                                                    </div>
                                                </div>

                                                {(new Date(shift.start) > new Date()) && (
                                                    <button
                                                        onClick={() => handleTradePost(shift.id)}
                                                        className="bg-white/50 hover:bg-white text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Devret
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {shifts.length === 0 && !loading && <div className="text-center py-10 text-slate-400">Bu ay için vardiya bulunamadı.</div>}
                    </div>
                </div>
            ) : activeTab === 'HISTORY' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                                <tr>
                                    <th className="p-3">Tarih</th>
                                    <th className="p-3">İşlem</th>
                                    <th className="p-3 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.length === 0 ? (
                                    <tr><td colSpan={3} className="p-6 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                                ) : history.map(rec => (
                                    <tr key={rec.id}>
                                        <td className="p-3">
                                            <div className="font-bold text-slate-900">{format(new Date(rec.timestamp), 'd MMM', { locale: tr })}</div>
                                            <div className="text-xs text-slate-500">{format(new Date(rec.timestamp), 'HH:mm')}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${rec.type === 'CHECK_IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {rec.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            {rec.isLate ? (
                                                <span className="text-red-600 text-xs font-bold">GEÇ</span>
                                            ) : (
                                                <span className="text-green-600 text-xs font-bold">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 p-4 overflow-y-auto">
                    {marketTrades.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            Pazarda şu an açık vardiya yok.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {marketTrades.map(trade => (
                                <div key={trade.id} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                                            {trade.requester.profilePicture ? <img src={trade.requester.profilePicture} className="w-full h-full object-cover" /> : trade.requester.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{trade.requester.name}</p>
                                            <p className="text-xs text-slate-500">Vardiya Devrediyor</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-500">Tarih</span>
                                            <span className="text-sm font-bold text-slate-900">{format(new Date(trade.shift.start), 'd MMMM yyyy', { locale: tr })}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">Saat</span>
                                            <span className="text-sm font-bold text-indigo-600">{format(new Date(trade.shift.start), 'HH:mm')} - {format(new Date(trade.shift.end), 'HH:mm')}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleTakeShift(trade.id)}
                                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-200"
                                    >
                                        Vardiyayı Al
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
