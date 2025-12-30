"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Banknote, Download, Calendar, ArrowDownToLine, Printer } from "lucide-react";

export default function StaffPayrollPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

    useEffect(() => {
        fetch('/api/payroll')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPayrolls(data);
                setLoading(false);
            });
    }, []);

    const payslipRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!selectedPayroll) return;
        const printContent = payslipRef.current;
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore state (simplest way after raw innerHTML swap)
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-emerald-100 text-sm font-medium mb-1">Maaş Bilgilerim</p>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Bordro Geçmişi
                    </h1>
                </div>
                <div className="absolute right-0 top-0 p-4 opacity-10">
                    <Banknote className="h-32 w-32 -rotate-12" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700">
                        Ödeme Geçmişi
                    </div>
                    <div className="divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
                        ) : payrolls.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Henüz maaş kaydınız bulunmuyor.</div>
                        ) : (
                            payrolls.map(payroll => (
                                <div
                                    key={payroll.id}
                                    className={`p-4 flex items-center justify-between cursor-pointer transition ${selectedPayroll?.id === payroll.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedPayroll(payroll)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${payroll.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{format(new Date(payroll.year, payroll.month - 1), 'MMMM yyyy', { locale: tr })}</h3>
                                            <p className="text-xs text-slate-500">
                                                {payroll.status === 'PAID' ? 'Ödendi' : 'Onay Bekliyor'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right font-bold text-slate-900">
                                        ₺{payroll.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payslip Preview */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center justify-center min-h-[400px]">
                    {selectedPayroll ? (
                        <>
                            <div className="w-full bg-white shadow-xl p-8 text-xs md:text-sm text-slate-900 mb-4 max-w-md mx-auto print:block print:w-full print:max-w-none" ref={payslipRef}>
                                {/* PAYSLIP DESIGN START */}
                                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest">MAAŞ BORDROSU</h2>
                                        <p className="font-bold text-slate-500">Personel Takip A.Ş.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg">{format(new Date(selectedPayroll.year, selectedPayroll.month - 1), 'MMMM yyyy', { locale: tr })}</p>
                                        <p className="text-slate-400">#{selectedPayroll.id.slice(-6).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-6">
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">PERSONEL</p>
                                        <p className="font-bold text-lg">{selectedPayroll.user.name}</p>
                                        <p className="text-slate-500">{selectedPayroll.user.role}</p>
                                        <p className="text-slate-500">{selectedPayroll.user.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">ÖDEME TARİHİ</p>
                                        <p className="font-bold">{format(new Date(selectedPayroll.generatedAt), 'd MMM yyyy', { locale: tr })}</p>
                                        <div className={`mt-2 inline-block px-3 py-1 rounded border font-bold text-xs ${selectedPayroll.status === 'PAID' ? 'border-green-600 text-green-600' : 'border-amber-500 text-amber-500'}`}>
                                            {selectedPayroll.status === 'PAID' ? 'ÖDENDİ' : 'TASLAK'}
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full mb-6">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-2 font-bold text-slate-500">AÇIKLAMA</th>
                                            <th className="text-right py-2 font-bold text-slate-500">TUTAR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="py-2">Brüt Maaş</td>
                                            <td className="py-2 text-right">₺{(selectedPayroll.baseSalary * 1.4).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">SGK Primi (%14)</td>
                                            <td className="py-2 text-right text-red-500">- ₺{(selectedPayroll.baseSalary * 0.14).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">İşsizlik Primi (%1)</td>
                                            <td className="py-2 text-right text-red-500">- ₺{(selectedPayroll.baseSalary * 0.01).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="bg-slate-50 font-bold">
                                            <td className="py-2 pl-2">NET MAAŞ</td>
                                            <td className="py-2 text-right">₺{selectedPayroll.baseSalary.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                        {selectedPayroll.bonus > 0 && (
                                            <tr>
                                                <td className="py-2 text-green-600">Primler / Ek Ödemeler</td>
                                                <td className="py-2 text-right text-green-600">+ ₺{selectedPayroll.bonus.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )}
                                        {selectedPayroll.deductions > 0 && (
                                            <tr>
                                                <td className="py-2 text-red-500">Kesintiler / Avans</td>
                                                <td className="py-2 text-right text-red-500">- ₺{selectedPayroll.deductions.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-900 text-lg">
                                            <td className="py-4 font-black">TOPLAM ÖDENEN</td>
                                            <td className="py-4 text-right font-black">₺{selectedPayroll.totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tfoot>
                                </table>

                                <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-200">
                                    Bu belge elektronik ortamda oluşturulmuştur. Islak imza gerektirmez.
                                    <br />
                                    Personel Takip Sistemi © 2024
                                </div>
                                {/* PAYSLIP DESIGN END */}
                            </div>

                            <button onClick={handlePrint} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 flex items-center gap-2 transition active:scale-95">
                                <Printer className="h-5 w-5" />
                                Yazdır / PDF İndir
                            </button>
                        </>
                    ) : (
                        <div className="text-center text-slate-400">
                            <Banknote className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p>Detaylarını görüntülemek için soldan bir ay seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
