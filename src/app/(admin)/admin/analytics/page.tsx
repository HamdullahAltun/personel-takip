"use client";

import { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, Users, ArrowUpRight, ArrowDownRight, RefreshCcw, BrainCircuit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [analyzingdy, setAnalyzing] = useState(false);

    useEffect(() => {
        analyze("ATTRITION");
    }, []);

    const analyze = async (type: string) => {
        setAnalyzing(true);
        try {
            const res = await fetch(`/api/admin/predictive-analytics?type=${type}`);
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Prediktif İK Analitiği</h1>
                    <p className="text-slate-500">Yapay zeka ile personel davranışlarını proaktif analiz edin</p>
                </div>
                <button
                    onClick={() => analyze("ATTRITION")}
                    disabled={analyzingdy}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-200 transition-all"
                >
                    {analyzingdy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    Yeniden Analiz Et
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900">Ayrılma Riski</h3>
                            <p className="text-xs text-red-600 opacity-80">Son 30 gün verisi</p>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                        {data?.results?.filter((r: any) => r.riskLevel > 50).length || 0}
                    </div>
                    <div className="text-xs font-bold text-slate-500">Yüksek riskli personel</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900">Bağlılık Skoru</h3>
                            <p className="text-xs text-indigo-600 opacity-80">Genel Ortalama</p>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                        %78
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                        <ArrowUpRight className="h-3 w-3" />
                        Geçen aya göre +2.4
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-900">Aktif İşgücü</h3>
                            <p className="text-xs text-emerald-600 opacity-80">Toplam kapasite</p>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">
                        %92
                    </div>
                    <div className="text-xs font-bold text-slate-500">Kapasite kullanım oranı</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Risk Analizi (AI Öngörüsü)
                    </h3>

                    <div className="space-y-4">
                        {data?.results?.map((item: any, i: number) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:shadow-md transition bg-slate-50/50">
                                <div className={cn(
                                    "w-2 h-full rounded-full shrink-0",
                                    item.riskLevel > 70 ? "bg-red-500" : item.riskLevel > 40 ? "bg-orange-500" : "bg-yellow-500"
                                )} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                                            item.riskLevel > 70 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                        )}>
                                            %{item.riskLevel} Risk
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium mb-2">{item.reason}</p>
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-xs text-indigo-600 font-semibold flex items-start gap-2">
                                        <BrainCircuit className="h-4 w-4 shrink-0 mt-0.5" />
                                        {item.retentionPlan}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.results || data.results.length === 0) && (
                            <div className="text-center py-10 text-slate-400 italic">Yüksek riskli personel tespit edilmedi.</div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">AI Önerileri</h3>
                        <p className="text-slate-400 text-sm mb-6">Şirket genelindeki verimliliği artırmak için öneriler.</p>

                        <ul className="space-y-4">
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                <span className="text-sm text-slate-300">Yüksek riskli personellerle birebir görüşme planlayın.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                <span className="text-sm text-slate-300">Satış ekibi için motivasyon etkinliği düzenleyin (Moral düşük görünüyor).</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                <span className="text-sm text-slate-300">Uzaktan çalışma politikalarını gözden geçirin.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                </div>
            </div>
        </div>
    );
}
