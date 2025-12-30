"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, X, FileText, CalendarClock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function PendingApprovals() {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<'leaves' | 'expenses' | null>(null);

    const fetchData = async () => {
        try {
            // Fetch leaves
            const leaveRes = await fetch('/api/leaves');
            const leaveData = await leaveRes.json();
            if (leaveData.pendingLeaves) setLeaves(leaveData.pendingLeaves);

            // Fetch expenses
            const expenseRes = await fetch('/api/expenses');
            const expenseData = await expenseRes.json();
            if (Array.isArray(expenseData)) {
                setExpenses(expenseData.filter((e: any) => e.status === 'PENDING'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLeaveAction = async (id: string, status: string) => {
        let reason = null;
        if (status === 'REJECTED') {
            reason = prompt("Reddetme sebebi:");
            if (!reason) return;
        }

        try {
            await fetch('/api/leaves', {
                method: 'PATCH',
                body: JSON.stringify({ id, status, rejectionReason: reason }),
                headers: { 'Content-Type': 'application/json' }
            });
            toast.success(status === 'APPROVED' ? 'İzin onaylandı' : 'İzin reddedildi');
            fetchData();
        } catch (e) {
            toast.error("İşlem başarısız");
        }
    };

    const handleExpenseAction = async (id: string, status: string) => {
        let reason = null;
        if (status === 'REJECTED') {
            reason = prompt("Reddetme sebebi:");
            if (!reason) return;
        }

        try {
            await fetch('/api/expenses', {
                method: 'PATCH',
                body: JSON.stringify({ id, status, rejectionReason: reason }),
                headers: { 'Content-Type': 'application/json' }
            });
            toast.success(status === 'APPROVED' ? 'Harcama onaylandı' : 'Harcama reddedildi');
            fetchData();
        } catch (e) {
            toast.error("İşlem başarısız");
        }
    };

    const toggleExpand = (section: 'leaves' | 'expenses') => {
        if (expanded === section) setExpanded(null);
        else setExpanded(section);
    };

    if (loading) return <div className="animate-pulse h-40 bg-slate-100 rounded-2xl w-full"></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Expenses Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg tracking-tight">Bekleyen Harcamalar</h3>
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <span className="text-5xl font-black tracking-tighter">{expenses.length}</span>
                            <span className="text-white/80 ml-2 font-bold text-sm uppercase tracking-wide opacity-80">Adet</span>
                        </div>
                        <button
                            onClick={() => toggleExpand('expenses')}
                            className="bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                        >
                            {expanded === 'expenses' ? 'Gizle' : 'İncele'}
                            <ArrowRight className={`h-4 w-4 transition-transform ${expanded === 'expenses' ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Expenses List */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === 'expenses' ? 'max-h-[500px] border-t border-slate-100' : 'max-h-0'}`}>
                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-50">
                        {expenses.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Bekleyen harcama talebi yok.</div>
                        ) : expenses.map(expense => (
                            <div key={expense.id} className="p-5 hover:bg-indigo-50/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800">{expense.user.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                                                {format(new Date(expense.date), 'd MMM', { locale: tr })}
                                            </span>
                                            {expense.category && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-bold uppercase">{expense.category}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-indigo-600 text-lg">₺{expense.amount}</div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                                    {expense.description}
                                </p>
                                {expense.receiptImage && (
                                    <div className="mb-3">
                                        <a href={expense.receiptImage} target="_blank" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 underline decoration-2 underline-offset-2">Fişi Görüntüle</a>
                                    </div>
                                )}
                                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 border-dashed">
                                    <button
                                        onClick={() => handleExpenseAction(expense.id, 'APPROVED')}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm shadow-green-200 text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95"
                                    >
                                        <Check className="h-4 w-4" /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleExpenseAction(expense.id, 'REJECTED')}
                                        className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        <X className="h-4 w-4" /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leaves Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col transition-all duration-300">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <CalendarClock size={120} />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner">
                            <CalendarClock className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-lg tracking-tight">İzin Talepleri</h3>
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <span className="text-5xl font-black tracking-tighter">{leaves.length}</span>
                            <span className="text-white/80 ml-2 font-bold text-sm uppercase tracking-wide opacity-80">Bekleyen</span>
                        </div>
                        <button
                            onClick={() => toggleExpand('leaves')}
                            className="bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-900/20"
                        >
                            {expanded === 'leaves' ? 'Gizle' : 'Onayla/Reddet'}
                            <ArrowRight className={`h-4 w-4 transition-transform ${expanded === 'leaves' ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Leaves List */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded === 'leaves' ? 'max-h-[500px] border-t border-slate-100' : 'max-h-0'}`}>
                    <div className="overflow-y-auto max-h-[300px] divide-y divide-slate-50">
                        {leaves.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Bekleyen izin talebi yok.</div>
                        ) : leaves.map(leave => (
                            <div key={leave.id} className="p-5 hover:bg-orange-50/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-slate-800">{leave.user.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md font-bold">
                                                {format(new Date(leave.startDate), 'd MMM', { locale: tr })} - {format(new Date(leave.endDate), 'd MMM', { locale: tr })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                    "{leave.reason}"
                                </p>
                                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 border-dashed">
                                    <button
                                        onClick={() => handleLeaveAction(leave.id, 'APPROVED')}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm shadow-green-200 text-xs font-bold flex items-center gap-2 transition-all transform active:scale-95"
                                    >
                                        <Check className="h-4 w-4" /> Onayla
                                    </button>
                                    <button
                                        onClick={() => handleLeaveAction(leave.id, 'REJECTED')}
                                        className="px-4 py-2 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                    >
                                        <X className="h-4 w-4" /> Reddet
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
