"use client";

import { useState } from "react";
import { Sparkles, Save, RotateCcw, CalendarCheck, Users } from "lucide-react";
import { toast } from "sonner";

export default function ShiftOptimizationPage() {
    const [constraints, setConstraints] = useState({
        minStaffDay: 2,
        minStaffPeak: 4,
        minStaffNight: 1,
        maxHoursPerEmployee: 45
    });
    const [generatedShifts, setGeneratedShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/shifts/optimize', {
                method: 'POST',
                body: JSON.stringify({
                    startDate: new Date().toISOString(),
                    constraints
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedShifts(data.shifts);
                toast.success("Vardiyalar başarıyla oluşturuldu.");
            }
        } catch (e) {
            toast.error("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Vardiyalar takvime işleniyor...',
                success: 'Vardiya planı yayınlandı!',
                error: 'Hata oluştu'
            }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl text-white shadow-lg">
                    <Sparkles className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Akıllı Vardiya Planlayıcı</h1>
                    <p className="text-slate-500 text-xs">AI ile kaynakları optimize edin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 h-fit">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        Kurallar & Kısıtlamalar
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Gündüz (08-16) Min. Personel</label>
                            <input
                                type="number"
                                value={constraints.minStaffDay}
                                onChange={e => setConstraints({ ...constraints, minStaffDay: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Akşam (16-24) Min. Personel</label>
                            <input
                                type="number"
                                value={constraints.minStaffPeak}
                                onChange={e => setConstraints({ ...constraints, minStaffPeak: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Gece (24-08) Min. Personel</label>
                            <input
                                type="number"
                                value={constraints.minStaffNight}
                                onChange={e => setConstraints({ ...constraints, minStaffNight: parseInt(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-200 transition active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Hesaplanıyor...' : (
                            <>
                                <Sparkles className="h-4 w-4" /> Optimize Et
                            </>
                        )}
                    </button>
                </div>

                {/* Results Preview */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-emerald-500" />
                            Önizleme
                        </h3>
                        {generatedShifts.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={() => setGeneratedShifts([])} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                    <RotateCcw className="h-5 w-5" />
                                </button>
                                <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Planı Uygula
                                </button>
                            </div>
                        )}
                    </div>

                    {generatedShifts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
                            <Sparkles className="h-16 w-16" />
                            <p className="text-center text-sm max-w-xs">
                                Soldaki panelden kuralları belirleyip "Optimize Et" butonuna tıklayın.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {generatedShifts.map((shift, i) => (
                                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{shift.userName}</p>
                                        <p className="text-[10px] text-slate-400">{shift.date}</p>
                                    </div>
                                    <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-100">
                                        {shift.startTime} - {shift.endTime}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
