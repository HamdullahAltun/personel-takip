"use client";

import { useState, useEffect } from "react";
import { DollarSign, Wallet, TrendingUp, TrendingDown, PieChart, BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function FinancialPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics/financial')
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="space-y-4 p-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-60 w-full" /></div>;
    if (!data) return <div className="p-8 text-center text-slate-500">Veri yüklenemedi.</div>;

    const budgetUsage = ((data.currentExpense + data.currentPayroll) / data.totalBudget) * 100;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-600 p-3 rounded-xl text-white shadow-lg shadow-emerald-200">
                    <DollarSign className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Finansal Genel Bakış</h1>
                    <p className="text-slate-500 text-xs text-nowrap">Maaş, harcama ve bütçe analizi.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <DollarSign className="h-24 w-24 -rotate-12" />
                    </div>
                    <div className="relative">
                        <p className="text-slate-500 text-sm font-bold mb-1">Toplam Harcama (Bu Ay)</p>
                        <h2 className="text-3xl font-black text-slate-900">
                            {data.currentExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </h2>
                        <div className="flex items-center gap-1 mt-2 text-red-500 text-xs font-bold">
                            <TrendingUp className="h-3 w-3" />
                            <span>%12 artış</span>
                            <span className="text-slate-400 font-normal ml-1">geçen aya göre</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition">
                        <Wallet className="h-24 w-24 -rotate-12" />
                    </div>
                    <div className="relative">
                        <p className="text-slate-500 text-sm font-bold mb-1">Maaş Ödemeleri</p>
                        <h2 className="text-3xl font-black text-slate-900">
                            {data.currentPayroll.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </h2>
                        <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs">
                            <span className="font-bold text-slate-600">Bu ay ödenecek tutar</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-bold mb-1">Kalan Bütçe</p>
                            <h2 className="text-3xl font-black">
                                {(data.totalBudget - (data.currentExpense + data.currentPayroll)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                            </h2>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-lg">
                            <PieChart className="h-5 w-5 text-emerald-400" />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-xs mb-1 text-slate-400">
                            <span>Kullanım</span>
                            <span>%{budgetUsage.toFixed(1)}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${budgetUsage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend Bar Chart */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-indigo-500" />
                            6 Aylık Harcama Trendi
                        </h3>
                    </div>

                    <div className="relative h-64 flex items-end gap-2 justify-between px-2">
                        {data.monthlyData.map((m: any, i: number) => {
                            const max = Math.max(...data.monthlyData.map((d: any) => d.expense + d.payroll));
                            const height = ((m.expense + m.payroll) / max) * 100;

                            return (
                                <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                                    <div className="w-full max-w-[40px] bg-slate-100 rounded-t-xl relative overflow-hidden hover:bg-slate-200 transition-colors" style={{ height: `${height}%` }}>
                                        {/* Stacked: Expense (Bottom) */}
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-indigo-500 group-hover:bg-indigo-600 transition-colors w-full"
                                            style={{ height: `${(m.payroll / (m.expense + m.payroll)) * 100}%` }}
                                        />
                                        <div
                                            className="absolute top-0 left-0 right-0 bg-orange-400 group-hover:bg-orange-500 transition-colors w-full"
                                            style={{ height: `${(m.expense / (m.expense + m.payroll)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{m.month}</span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-900 text-white text-[10px] p-2 rounded-lg whitespace-nowrap z-10">
                                        Payroll: {m.payroll.toLocaleString()} ₺<br />
                                        Expense: {m.expense.toLocaleString()} ₺
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-full" /> Maaş</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-full" /> Harcama</div>
                    </div>
                </div>

                {/* Expense Categories */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-orange-500" />
                        Harcama Dağılımı
                    </h3>

                    <div className="space-y-4">
                        {[
                            { label: "Personel Yemek & Ulaşım", value: 45, color: "bg-blue-500" },
                            { label: "Ofis Malzemeleri", value: 15, color: "bg-emerald-500" },
                            { label: "Yazılım & Lisans", value: 25, color: "bg-purple-500" },
                            { label: "Diğer", value: 15, color: "bg-slate-300" },
                        ].map((cat, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1 font-bold text-slate-600">
                                    <span>{cat.label}</span>
                                    <span>%{cat.value}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div className={`h-full ${cat.color}`} style={{ width: `${cat.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                        <TrendingDown className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-orange-800 text-sm">Tasarruf Önerisi (AI)</h4>
                            <p className="text-xs text-orange-700 mt-1">
                                Yazılım lisans giderleri geçen aya göre %15 arttı. Kullanılmayan hesapları kontrol etmeniz önerilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
