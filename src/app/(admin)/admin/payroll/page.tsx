"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calculator, CheckCircle, Banknote, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminPayrollPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
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
    };

    const handleCalculateAll = async () => {
        setCalculating(true);
        try {
            await fetch('/api/payroll', {
                method: 'POST',
                body: JSON.stringify({ action: 'CALCULATE_ALL', month, year }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetchData();
        } catch (e) {
            alert("Hesaplama hatası");
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

    const totalPayout = payrolls.reduce((acc, curr) => acc + curr.totalPaid, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Maaş & Bordro Yönetimi</h1>
                    <p className="text-slate-500">Personel maaşlarını hesaplayın ve yönetin</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                    <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="p-2 bg-transparent font-medium outline-none">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM', { locale: tr })}</option>
                        ))}
                    </select>
                    <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="p-2 bg-transparent font-medium outline-none">
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                </div>

                <button
                    onClick={handleCalculateAll}
                    disabled={calculating}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition active:scale-95 disabled:opacity-50"
                >
                    {calculating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Calculator className="h-5 w-5" />}
                    {calculating ? 'Hesaplanıyor...' : 'Tümünü Hesapla'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Toplam Ödenecek</p>
                    <h2 className="text-3xl font-bold text-slate-900 mt-2">₺{totalPayout.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Personel Sayısı</p>
                    <h2 className="text-3xl font-bold text-slate-900 mt-2">{payrolls.length}</h2>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">Ödenenler</p>
                    <h2 className="text-3xl font-bold text-green-600 mt-2">{payrolls.filter(p => p.status === 'PAID').length} / {payrolls.length}</h2>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="p-4 font-medium">Personel</th>
                            <th className="p-4 font-medium">Saatlik Ücret</th>
                            <th className="p-4 font-medium">Asıl Maaş</th>
                            <th className="p-4 font-medium">Prim/Kesinti</th>
                            <th className="p-4 font-medium">NET Ödenecek</th>
                            <th className="p-4 font-medium">Durum</th>
                            <th className="p-4 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center">Yükleniyor...</td></tr>
                        ) : payrolls.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Bu ay için maaş hesaplaması yapılmamış. "Tümünü Hesapla" butonunu kullanın.</td></tr>
                        ) : (
                            payrolls.map((payroll) => (
                                <tr key={payroll.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-900">
                                        {payroll.user.name}
                                        <div className="text-xs text-slate-400 font-normal">{payroll.user.phone}</div>
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        ₺{payroll.user.hourlyRate}
                                    </td>
                                    <td className="p-4 text-slate-500 font-mono">
                                        ₺{payroll.baseSalary.toLocaleString('tr-TR')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-xs">
                                            <span className="text-green-600">+ ₺{payroll.bonus}</span>
                                            <span className="text-red-500">- ₺{payroll.deductions}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-900 text-base">
                                        ₺{payroll.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4">
                                        {payroll.status === 'PAID' ? (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Ödendi
                                            </span>
                                        ) : (
                                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1">
                                                <AlertCircle className="h-3 w-3" /> Taslak
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {payroll.status !== 'PAID' && (
                                            <button
                                                onClick={() => handleMarkPaid(payroll.id)}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1 ml-auto"
                                            >
                                                <Banknote className="h-3 w-3" /> Öde
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
    );
}
