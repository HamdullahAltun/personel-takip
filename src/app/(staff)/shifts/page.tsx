"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Clock, PlusCircle, Repeat } from "lucide-react";
import { Shift } from "@prisma/client";
import ShiftTabs from "@/components/shifts/ShiftTabs";
import MarketplaceTab from "@/components/shifts/MarketplaceTab";
import { createSwapRequest } from "@/actions/shifts/marketplace";
import { toast } from "sonner";

export default function StaffShiftsPage() {
    const [activeTab, setActiveTab] = useState<'MY_SHIFTS' | 'MARKETPLACE'>('MY_SHIFTS');
    const [date, setDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');

    useEffect(() => {
        if (activeTab === 'MY_SHIFTS') {
            fetchShifts();
        }
    }, [date, viewMode, activeTab]);

    const fetchShifts = async () => {
        setLoading(true);
        let start, end;

        if (viewMode === 'WEEK') {
            start = startOfWeek(date, { weekStartsOn: 1 }).toISOString();
            end = endOfWeek(date, { weekStartsOn: 1 }).toISOString();
        } else {
            start = startOfMonth(date).toISOString();
            end = endOfMonth(date).toISOString();
        }

        const res = await fetch(`/api/shifts?start=${start}&end=${end}`);
        if (res.ok) {
            setShifts(await res.json());
        }
        setLoading(false);
    };

    // Swap Modal State
    const [swapShiftId, setSwapShiftId] = useState<string | null>(null);
    const [swapReason, setSwapReason] = useState("");

    const handleSwapRequest = async () => {
        if (!swapShiftId) return;

        const promise = createSwapRequest(swapShiftId, swapReason);

        toast.promise(promise, {
            loading: 'Talep oluşturuluyor...',
            success: (res: any) => {
                if (res.success) {
                    setSwapShiftId(null);
                    setSwapReason("");
                    return "Takas talebi oluşturuldu!";
                } else {
                    throw new Error(res.error);
                }
            },
            error: (err: any) => err.message || "Hata oluştu"
        });
    };

    // Overtime Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestDate, setRequestDate] = useState("");
    const [requestTime, setRequestTime] = useState("");
    const [requestDuration, setRequestDuration] = useState(4);
    const [requestNotes, setRequestNotes] = useState("");

    const handleOpenModal = () => {
        const now = new Date();
        setRequestDate(format(now, 'yyyy-MM-dd'));
        setRequestTime(format(now, 'HH:mm'));
        setRequestNotes("");
        setIsModalOpen(true);
    };

    const handleRequestOvertime = async (e: React.FormEvent) => {
        e.preventDefault();

        const start = new Date(`${requestDate}T${requestTime}`);
        const end = new Date(start.getTime() + requestDuration * 60 * 60 * 1000);

        const promise = fetch('/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startTime: start,
                endTime: end,
                type: 'OVERTIME',
                notes: requestNotes,
                isOvertime: true
            })
        }).then(async res => {
            if (!res.ok) throw new Error("Talep oluşturulamadı");
            return res;
        });

        toast.promise(promise, {
            loading: 'Mesai talebi gönderiliyor...',
            success: () => {
                setIsModalOpen(false);
                fetchShifts();
                return "Mesai talebi oluşturuldu. Yönetici onayı bekleniyor.";
            },
            error: "Talep oluşturulamadı."
        });
    };

    const handlePrev = () => viewMode === 'WEEK' ? setDate(subWeeks(date, 1)) : setDate(subWeeks(date, 4));
    const handleNext = () => viewMode === 'WEEK' ? setDate(addWeeks(date, 1)) : setDate(addWeeks(date, 4));

    const sortedShifts = [...shifts].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Group by day for list view
    const days = eachDayOfInterval({
        start: viewMode === 'WEEK' ? startOfWeek(date, { weekStartsOn: 1 }) : startOfMonth(date),
        end: viewMode === 'WEEK' ? endOfWeek(date, { weekStartsOn: 1 }) : endOfMonth(date)
    });

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] max-w-lg mx-auto pb-20">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Vardiyalarım</h1>
                        <p className="text-xs text-slate-500">Çalışma planı ve mesai talepleri</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                >
                    <PlusCircle size={20} />
                </button>
            </div>

            <ShiftTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'MARKETPLACE' ? (
                <div className="flex-1 overflow-y-auto">
                    <MarketplaceTab />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-slate-50">
                        <button onClick={handlePrev} className="p-2 hover:bg-white rounded-full shadow-sm transition"><ChevronLeft className="h-4 w-4" /></button>
                        <span className="font-bold text-slate-800">{format(date, 'MMMM yyyy', { locale: tr })}</span>
                        <button onClick={handleNext} className="p-2 hover:bg-white rounded-full shadow-sm transition"><ChevronRight className="h-4 w-4" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {days.map(day => {
                            const dayShifts = shifts.filter(s => isSameDay(new Date(s.startTime), day));
                            if (dayShifts.length === 0) return null;

                            return (
                                <div key={day.toString()} className="space-y-2">
                                    <div className="flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-1">
                                        <div className={`text-xs font-bold px-3 py-1 rounded-full ${isSameDay(day, new Date()) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                            {format(day, 'd MMM EEEE', { locale: tr })}
                                        </div>
                                        <div className="h-px bg-slate-100 flex-1"></div>
                                    </div>

                                    {dayShifts.map(shift => (
                                        <div key={shift.id} className={`p-4 rounded-xl border flex flex-col gap-3 relative overflow-hidden ${shift.type === 'OVERTIME' || shift.isOvertime
                                            ? 'bg-amber-50 border-amber-100'
                                            : 'bg-white border-slate-100 shadow-sm'
                                            }`}>
                                            {shift.status === 'DRAFT' && (
                                                <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">ONAY BEKLİYOR</div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-full ${shift.type === 'OVERTIME' || shift.isOvertime ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold ${shift.type === 'OVERTIME' || shift.isOvertime ? 'text-amber-900' : 'text-slate-900'}`}>
                                                            {shift.title || (shift.isOvertime ? 'Fazla Mesai' : 'Vardiya')}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xs font-bold text-slate-400">Süre</div>
                                                    <div className="font-bold text-slate-700">
                                                        {((new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)} s
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            {shift.status === 'PUBLISHED' && !shift.isOvertime && (
                                                <div className="flex justify-end border-t border-slate-100 pt-3">
                                                    <button
                                                        onClick={() => setSwapShiftId(shift.id)}
                                                        className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded"
                                                    >
                                                        <Repeat size={14} />
                                                        Devret / Takas Et
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}

                        {shifts.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-50">
                                <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-400 font-medium">Bu aralıkta vardiya bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Overtime Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Fazla Mesai Talep Et</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <PlusCircle className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleRequestOvertime} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={requestDate}
                                        onChange={e => setRequestDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Saat</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={requestTime}
                                        onChange={e => setRequestTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Süre (Saat)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={requestDuration}
                                    onChange={e => setRequestDuration(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Açıklama / Neden</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={requestNotes}
                                    onChange={e => setRequestNotes(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200">
                                Talep Gönder
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Swap Request Modal */}
            {swapShiftId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Vardiya Devret / Takas</h3>
                            <button onClick={() => setSwapShiftId(null)} className="text-slate-400 hover:text-slate-600">
                                <PlusCircle className="rotate-45" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-slate-500">
                                Bu vardiyayı takas pazarına göndermek üzeresiniz. Başka bir personel devralana kadar sorumluluk sizdedir.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Sebep / Not</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Örn: Acil işim çıktı..."
                                    value={swapReason}
                                    onChange={e => setSwapReason(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSwapRequest}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Pazara Gönder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

