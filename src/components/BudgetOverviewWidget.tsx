"use client";

import { useState, useEffect } from "react";
import { DollarSign, Building2 } from "lucide-react";

interface Department {
    id: string;
    name: string;
    budgetLimit: number;
    budgetUsed: number;
}

export default function BudgetOverviewWidget() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/departments").then(res => res.json()).then(data => {
            setDepartments(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="animate-pulse bg-slate-100 rounded-2xl h-full"></div>;

    const totalBudget = departments.reduce((acc, d) => acc + d.budgetLimit, 0);
    const totalUsed = departments.reduce((acc, d) => acc + d.budgetUsed, 0);
    const totalUsagePercent = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Finansal Limit İzleyici</h3>
            </div>
            <div className="p-5 space-y-6">
                <div className="flex flex-col items-center">
                    <div className="text-3xl font-black text-slate-900">{totalUsed.toLocaleString('tr-TR')} TL</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Toplam Aylık Harcama</div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-500 uppercase tracking-tighter">Genel Bütçe Kullanımı</span>
                            <span className={totalUsagePercent > 80 ? 'text-rose-500' : 'text-emerald-600'}>%{totalUsagePercent.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${totalUsagePercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${totalUsagePercent}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {departments.slice(0, 3).map((dept) => {
                            const p = dept.budgetLimit > 0 ? (dept.budgetUsed / dept.budgetLimit) * 100 : 0;
                            return (
                                <div key={dept.id} className="flex justify-between items-center text-[10px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-3 h-3 text-slate-400" />
                                        <span className="font-bold text-slate-700">{dept.name}</span>
                                    </div>
                                    <span className={`font-black ${p > 90 ? 'text-rose-600' : 'text-slate-500'}`}>%{p.toFixed(0)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
