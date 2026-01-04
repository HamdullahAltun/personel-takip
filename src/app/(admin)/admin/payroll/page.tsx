"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calculator, CheckCircle, Banknote, AlertCircle, RefreshCw, Download, BrainCircuit, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPayrollPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
            const data = await res.json();
            setPayrolls(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleCalculateAdvanced = async () => {
        setCalculating(true);
        try {
            const res = await fetch('/api/admin/payroll/calculate-advanced', {
                method: 'POST',
                body: JSON.stringify({ month, year }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                fetchData();
            } else {
                alert("AI Hesaplama hatası");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCalculating(false);
        }
    };

    const handleMarkPaid = async (id: string) => {
        if (!confirm("Ödeme yapıldı olarak işaretlensin mi?")) return;
        await fetch('/api/payroll', {
            method: 'PATCH',
            body: JSON.stringify({ id, status: 'PAID' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    const exportToEFT = () => {
        const eftData = payrolls.map(p => ({
            personel: p.user.name,
            iban: "TR0000 0000 0000 0000 0000 00", // Mock IBAN
            tutar: p.totalPaid,
            aciklama: `${month}/${year} Personel Maasi`,
            tarih: format(new Date(), 'yyyy-MM-dd')
        }));

        const blob = new Blob([JSON.stringify(eftData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EFT_ODEME_LISTESI_${month}_${year}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalPayout = payrolls.reduce((acc, curr) => acc + curr.totalPaid, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Maaş & Bordro (Advanced)</h1>
                    <p className="text-slate-500 font-medium">AI destekli prim ve kesinti hesaplama sistemi</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="p-2 bg-transparent font-bold text-slate-700 outline-none">
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM', { locale: tr })}</option>
                            ))}
                        </select>
                        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="p-2 bg-transparent font-bold text-slate-700 outline-none">
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCalculateAdvanced}
                        disabled={calculating}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-700 flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {calculating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
                        {calculating ? 'AI Analiz Ediyor...' : 'AI Akıllı Hesapla'}
                    </button>

                    <button
                        onClick={exportToEFT}
                        disabled={payrolls.length === 0}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 flex items-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <FileJson className="h-5 w-5 text-amber-400" />
                        EFT Dosyası İndir
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Toplam Ödenecek</p>
                    <h2 className="text-3xl font-black mt-2">₺{totalPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Personel Sayısı</p>
                    <h2 className="text-3xl font-black text-slate-800 mt-2">{payrolls.length}</h2>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">AI Prim Toplamı</p>
                    <h2 className="text-3xl font-black text-green-600 mt-2">₺{payrolls.reduce((acc, p) => acc + p.bonus, 0).toLocaleString('tr-TR')}</h2>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Ödenenler</p>
                    <h2 className="text-3xl font-black text-blue-600 mt-2">{payrolls.filter(p => p.status === 'PAID').length} / {payrolls.length}</h2>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Personel & Kimlik</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Referans Metrikler</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Baz Maaş</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">AI Prim/Kesinti</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">NET Tutar</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Durum</th>
                                <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400 animate-pulse font-bold">Veriler Yükleniyor...</td></tr>
                            ) : payrolls.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">"AI Akıllı Hesapla" butonu ile süreci başlatın.</td></tr>
                            ) : (
                                payrolls.map((payroll) => (
                                    <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                    {payroll.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900">{payroll.user.name}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{payroll.user.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="text-[10px] text-slate-500 leading-tight italic max-w-xs">{payroll.note}</div>
                                        </td>
                                        <td className="p-6 font-bold text-slate-600">
                                            ₺{payroll.baseSalary.toLocaleString('tr-TR')}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider shadow-sm border border-green-200">+ ₺{payroll.bonus}</span>
                                                <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider">- ₺{payroll.deductions}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-black text-indigo-600 text-xl tracking-tighter">
                                                ₺{payroll.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {payroll.status === 'PAID' ? (
                                                <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-2xl text-[10px] font-black flex items-center gap-1.5 uppercase shadow-sm border border-emerald-200">
                                                    <CheckCircle className="h-3 w-3" /> Ödendi
                                                </div>
                                            ) : (
                                                <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-2xl text-[10px] font-black flex items-center gap-1.5 uppercase shadow-sm border border-amber-200">
                                                    <AlertCircle className="h-3 w-3" /> Ödeme Taslak
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            {payroll.status !== 'PAID' && (
                                                <button
                                                    onClick={() => handleMarkPaid(payroll.id)}
                                                    className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-slate-800 shadow-xl shadow-slate-200 flex items-center gap-2 ml-auto group-hover:scale-105 transition-all active:scale-95"
                                                >
                                                    <Banknote className="h-4 w-4" /> Ödeme Yap
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
