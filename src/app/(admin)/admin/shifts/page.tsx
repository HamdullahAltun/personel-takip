"use client";



import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfDay, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter, User as UserIcon, Clock, Repeat } from "lucide-react";
import ShiftModal from "@/components/admin/ShiftModal";
import { Shift, User } from "@prisma/client";

function ShiftCard({ shift, onClick, mobile }: { shift: Shift & { user: User }, onClick: () => void, mobile?: boolean }) {
    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-xl border shadow-sm cursor-pointer hover:scale-[1.02] transition-all active:scale-95 ${shift.isOvertime
                ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
                : 'bg-white border-slate-100 hover:border-indigo-400'
                } ${mobile ? 'flex items-center justify-between gap-4' : ''}`}
        >
            <div className={`flex items-center gap-3 ${mobile ? '' : 'mb-3'}`}>
                {shift.user.profilePicture ? (
                    <img src={shift.user.profilePicture} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                        {shift.user.name[0]}
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{shift.user.name}</p>
                    {shift.title && <p className="text-[10px] text-slate-500 truncate">{shift.title}</p>}
                </div>
            </div>

            <div className={`flex flex-col ${mobile ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs font-black ${shift.isOvertime ? 'text-amber-700' : 'text-indigo-700'}`}>
                    {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                </div>
                {shift.isOvertime && (
                    <span className="mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded uppercase tracking-wider">Mesai</span>
                )}
                {shift.status === 'DRAFT' && (
                    <span className="mt-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-bold rounded uppercase tracking-wider animate-pulse">Onay Bekliyor</span>
                )}
            </div>
        </div>
    );
}

export default function AdminShiftsPage() {
    const [date, setDate] = useState(new Date());
    const [shifts, setShifts] = useState<(Shift & { user: User })[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<(Shift & { user: User }) | null>(null);
    const [selectedSlotDate, setSelectedSlotDate] = useState<Date | undefined>(undefined);
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>("");

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchShifts();
    }, [date, selectedUserFilter]);

    const fetchShifts = async () => {
        setLoading(true);
        const start = startOfWeek(date, { weekStartsOn: 1 }).toISOString();
        const end = endOfWeek(date, { weekStartsOn: 1 }).toISOString();

        let url = `/api/shifts?start=${start}&end=${end}`;
        if (selectedUserFilter) url += `&userId=${selectedUserFilter}`;

        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            setShifts(data);
        }
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Fetch users error:", error);
        }
    };

    const handlePreviousWeek = () => setDate(subWeeks(date, 1));
    const handleNextWeek = () => setDate(addWeeks(date, 1));

    const days = eachDayOfInterval({
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 })
    });

    const handleAddShift = (d?: Date) => {
        setSelectedShift(null);
        setSelectedSlotDate(d);
        setIsModalOpen(true);
    };

    const handleEditShift = (shift: Shift & { user: User }) => {
        setSelectedShift(shift);
        setIsModalOpen(true);
    };

    const handleSaveShift = async (shiftData: any) => {
        const method = selectedShift ? 'PUT' : 'POST';
        const url = selectedShift ? `/api/shifts/${selectedShift.id}` : '/api/shifts';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shiftData)
        });

        if (res.ok) {
            fetchShifts();
            return;
        }
        throw new Error("Failed");
    };

    const handleDeleteShift = async (id: string) => {
        const res = await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchShifts();
            return;
        }
        throw new Error("Failed");
    };

    // Calculate daily stats
    const getDailyStats = (day: Date) => {
        const dayShifts = shifts.filter(s => isSameDay(new Date(s.startTime), day));
        const totalPeople = dayShifts.length;
        const overtimeCount = dayShifts.filter(s => s.isOvertime).length;
        return { totalPeople, overtimeCount };
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Vardiya Yönetimi</h1>
                        <p className="text-sm text-slate-500">Personel çalışma planı ve mesai takibi</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Filter className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                        <select
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                            value={selectedUserFilter}
                            onChange={e => setSelectedUserFilter(e.target.value)}
                        >
                            <option value="">Tüm Personel</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => handleAddShift()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        <span className="hidden md:inline">Yeni Vardiya</span>
                    </button>

                    <a
                        href="/admin/shifts/approvals"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold shadow-sm transition-all"
                    >
                        <Repeat size={20} />
                        <span className="hidden md:inline">Takas Onayları</span>
                    </a>
                </div>
            </header>

            {/* Pending Requests Notification */}
            {shifts.some(s => s.status === 'DRAFT') && (
                <div className="mx-4 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500 rounded-lg text-white">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-rose-900">
                                {shifts.filter(s => s.status === 'DRAFT').length} Bekleyen Talep Var
                            </p>
                            <p className="text-xs text-rose-600 font-medium">Lütfen onaylamak veya reddetmek için vardiyalara tıklayın.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <button onClick={handlePreviousWeek} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="font-bold text-lg text-slate-800">
                    {format(date, 'MMMM yyyy', { locale: tr })}
                </div>
                <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-6">
                <div className="md:min-w-[1000px] h-full flex flex-col">
                    {/* Week Header - Desktop */}
                    <div className="hidden md:grid grid-cols-7 gap-4 mb-4">
                        {days.map(day => (
                            <div key={day.toString()} className={`text-center p-3 rounded-xl border ${isSameDay(day, new Date()) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
                                <div className="text-xs font-medium opacity-80 uppercase">{format(day, 'EEE', { locale: tr })}</div>
                                <div className="text-xl font-bold">{format(day, 'd')}</div>
                                <div className="mt-1 flex justify-center gap-1">
                                    {getDailyStats(day).overtimeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${getDailyStats(day).overtimeCount} mesai`}></span>}
                                    <span className="text-[10px] opacity-70">{getDailyStats(day).totalPeople} Kişi</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Week Content - Desktop */}
                    <div className="hidden md:grid grid-cols-7 gap-4 flex-1">
                        {days.map(day => {
                            const dayShifts = shifts.filter(s => isSameDay(new Date(s.startTime), day));
                            dayShifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                            return (
                                <div key={day.toString()} className="bg-slate-100/50 rounded-xl p-2 min-h-[500px] relative group border border-dashed border-slate-200 hover:border-indigo-300 transition-colors">
                                    <div className="space-y-2 relative z-10">
                                        {dayShifts.map(shift => (
                                            <ShiftCard key={shift.id} shift={shift} onClick={() => handleEditShift(shift)} />
                                        ))}

                                        <button
                                            onClick={() => handleAddShift(day)}
                                            className="w-full py-4 rounded-lg border border-dashed border-slate-300 text-slate-400 text-xs font-bold hover:bg-white hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Plus className="h-4 w-4" /> Ekle
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile View - Vertical List */}
                    <div className="md:hidden space-y-6">
                        {days.map(day => {
                            const dayShifts = shifts.filter(s => isSameDay(new Date(s.startTime), day));
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div key={day.toString()} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className={`p-4 flex items-center justify-between border-b ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="text-center">
                                                <div className="text-[10px] uppercase font-bold opacity-80">{format(day, 'EEE', { locale: tr })}</div>
                                                <div className="text-xl font-black">{format(day, 'd')}</div>
                                            </div>
                                            <div className="h-8 w-px bg-current opacity-20"></div>
                                            <div className="font-bold">{format(day, 'MMMM', { locale: tr })}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAddShift(day)}
                                            className={`p-2 rounded-lg ${isToday ? 'bg-white/20 hover:bg-white/30' : 'bg-indigo-600 text-white'}`}
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        {dayShifts.length > 0 ? (
                                            dayShifts.map(shift => (
                                                <ShiftCard key={shift.id} shift={shift} onClick={() => handleEditShift(shift)} mobile />
                                            ))
                                        ) : (
                                            <div className="py-4 text-center text-slate-400 text-xs italic border border-dashed rounded-xl">
                                                Bu gün için vardiya planlanmadı.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ShiftModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveShift}
                onDelete={handleDeleteShift}
                users={users}
                initialShift={selectedShift}
                selectedDate={selectedSlotDate}
            />
        </div>
    );
}
