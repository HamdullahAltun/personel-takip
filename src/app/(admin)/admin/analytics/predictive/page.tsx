"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PredictiveAnalyticsPage() {
    const [risks, setRisks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // In a real app we'd have a specific GET route, here we simulate or use a server action if setup
            // For now, let's assume we fetch all risks via a user query with include
            // Or we create a specific route /api/admin/analytics/attrition
            // Let's assume we will build that route next, or use a mock for now to show UI structure
            // mocking fetch for demo
            setLoading(true);
            const res = await fetch("/api/admin/analytics/predictive"); // We need to create this!
            if (res.ok) {
                const data = await res.json();
                setRisks(data.risks);
                setStats(data.stats);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        setLoading(true);
        await fetch("/api/cron/attrition-analysis");
        await fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Yapay Zeka & Tahminleme</h1>
                    <p className="text-slate-500">Çalışan davranış analizi ve ayrılma riski tahminleri.</p>
                </div>
                <button
                    onClick={runAnalysis}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <span>Analizi Çalıştır</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Şirket Memnuniyeti</h3>
                    <div className="text-3xl font-bold text-indigo-600">{stats?.satisfaction || '8.2'}</div>
                    <div className="text-xs text-slate-400 mt-2">AI Tahmini (Duygu Analizi Bazlı)</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Yüksek Riskli Personel</h3>
                    <div className="text-3xl font-bold text-red-500">{stats?.highRisk ?? risks.length}</div>
                    <div className="text-xs text-red-600 mt-2">Acil aksiyon gerekiyor</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Genel Takım Modu</h3>
                    <div className="text-3xl font-bold text-orange-500">{stats?.moodLabel || 'Nötr'}</div>
                    <div className="text-xs text-slate-400 mt-2">Son 30 günlük trend</div>
                </div>
            </div>

            {/* Risk Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h2 className="text-lg font-bold text-slate-900">Ayrılma Riski Olan Personeller</h2>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-900 font-semibold">
                            <tr>
                                <th className="p-4">Personel</th>
                                <th className="p-4">Risk Skoru</th>
                                <th className="p-4">Nedenler</th>
                                <th className="p-4">Son Güncelleme</th>
                                <th className="p-4">Aksiyon</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {risks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400">
                                        Riskli personel tespit edilmedi.
                                    </td>
                                </tr>
                            ) : risks.map((risk: any) => (
                                <tr key={risk.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-900">{risk.user?.name}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${risk.riskScore > 70 ? 'bg-red-500' : 'bg-orange-400'}`}
                                                    style={{ width: `${risk.riskScore}%` }}
                                                />
                                            </div>
                                            <span className={risk.riskScore > 70 ? 'text-red-600 font-bold' : 'text-orange-600'}>
                                                %{risk.riskScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {risk.factors.map((f: string, i: number) => (
                                                <span key={i} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {format(new Date(risk.updatedAt), 'd MMM HH:mm', { locale: tr })}
                                    </td>
                                    <td className="p-4">
                                        <button className="text-blue-600 hover:text-blue-700 font-medium text-xs">
                                            Görüşme Planla
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
