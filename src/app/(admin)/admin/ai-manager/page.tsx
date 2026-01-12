"use client";

import { useState, useEffect } from "react";
import { Brain, Settings, Calendar, Briefcase, Play, Terminal, Sparkles } from "lucide-react";

export default function AiManagerPage() {
    const [config, setConfig] = useState<any>({
        autoScheduleEnabled: false,
        minStaffPerShift: 3,
        operatingHoursStart: "",
        operatingHoursEnd: "",
        autoTaskAssignment: false,
        taskAssignmentMode: "BALANCED"
    });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchConfig();
        fetchLogs();
    }, []);

    const fetchConfig = async () => {
        const res = await fetch('/api/admin/ai/config');
        setConfig(await res.json());
        setLoading(false);
    };

    const fetchLogs = async () => {
        const res = await fetch('/api/admin/ai/logs');
        if (res.ok) setLogs(await res.json());
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/admin/ai/config', {
            method: 'POST',
            body: JSON.stringify(config),
            headers: { 'Content-Type': 'application/json' }
        });
        alert("Ayarlar kaydedildi.");
    };

    const runAutoSchedule = async () => {
        if (!confirm("⚠️ DİKKAT: Yapay zeka gelecek hafta için otomatik vardiya planlaması yapacak.\n\nMevcut planlar korunacak, sadece boşluklar doldurulacak.\nDevam etmek istiyor musunuz?")) return;

        const btn = document.getElementById('btn-schedule') as HTMLButtonElement;
        if (btn) btn.disabled = true;

        try {
            const res = await fetch('/api/admin/ai/actions/schedule', { method: 'POST' });
            const result = await res.json();
            if (res.ok) {
                alert(`✅ Başarılı!\n${result.message}`);
            } else {
                alert(`❌ Hata: ${result.message || "Bilinmeyen hata"}`);
            }
        } catch (e) {
            alert("❌ Bağlantı hatası!");
        } finally {
            if (btn) btn.disabled = false;
            fetchLogs();
        }
    };

    const runAutoAssign = async () => {
        if (!confirm("📌 Bilgi: Bekleyen ve sahipsiz görevler, personellerin yetenek ve yoğunluk durumuna göre otomatik dağıtılacak.\n\nOnaylıyor musunuz?")) return;
        const res = await fetch('/api/admin/ai/actions/assign-tasks', { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        fetchLogs();
    }

    const runOptimizer = async () => {
        const btn = document.activeElement as HTMLButtonElement;
        const originalText = btn.innerText;
        btn.innerText = "Analiz Ediliyor...";
        btn.disabled = true;

        try {
            const res = await fetch('/api/admin/ai/actions/optimize', { method: 'POST' });
            const result = await res.json();
            alert(`🧠 AI Analizi Tamamlandı:\n\n${result.insights || "Önemli bir optimizasyon fırsatı bulunamadı."}`);
        } catch (e) {
            alert("Analiz sırasında hata oluştu.");
        } finally {
            fetchLogs();
            btn.innerText = originalText;
            btn.disabled = false;
        }
    }

    if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30 backdrop-blur-md">
                                <Brain className="h-8 w-8 text-indigo-300" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">AI Şirket Yöneticisi</h1>
                        </div>
                        <p className="text-indigo-200/60 font-medium max-w-xl text-lg">
                            Şirket operasyonlarını otomatize eden, verimliliği artıran ve kararlar alan merkezi yapay zeka sistemi.
                        </p>
                    </div>
                    <div className="hidden lg:block text-right">
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="font-bold text-sm text-slate-300">Sistem Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* SETTINGS CARD */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Settings className="h-5 w-5 text-slate-600" />
                            </div>
                            Otomasyon Ayarları
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <label className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Otomatik Vardiya</label>
                                        <p className="text-xs text-slate-400">Her Pazar günü çalışır</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-indigo"
                                        checked={config.autoScheduleEnabled || false}
                                        onChange={e => setConfig({ ...config, autoScheduleEnabled: e.target.checked })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Başlangıç</span>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={config.operatingHoursStart || ""}
                                            onChange={e => setConfig({ ...config, operatingHoursStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-slate-500 mb-1">Bitiş</span>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={config.operatingHoursEnd || ""}
                                            onChange={e => setConfig({ ...config, operatingHoursEnd: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 mb-1">Min. Personel / Vardiya</span>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={config.minStaffPerShift || 0}
                                        onChange={e => setConfig({ ...config, minStaffPerShift: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <label className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">Görev Dağıtımı</label>
                                        <p className="text-xs text-slate-400">Yeni görevlerde çalışır</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-indigo"
                                        checked={config.autoTaskAssignment || false}
                                        onChange={e => setConfig({ ...config, autoTaskAssignment: e.target.checked })}
                                    />
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-500 mb-1">Dağıtım Modu</span>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={config.taskAssignmentMode || "BALANCED"}
                                        onChange={e => setConfig({ ...config, taskAssignmentMode: e.target.value })}
                                    >
                                        <option value="BALANCED">⚖️ Dengeli Dağıtım</option>
                                        <option value="SKILL">⭐ Yetenek Odaklı</option>
                                        <option value="SPEED">⚡ Hız Odaklı</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition active:scale-95 transform duration-150">
                                Ayarları Kaydet
                            </button>
                        </div>
                    </form>
                </div>

                {/* ACTIONS & LOGS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            id="btn-schedule"
                            onClick={runAutoSchedule}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-3xl shadow-lg shadow-indigo-200 transition text-left group relative overflow-hidden border border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Calendar className="h-24 w-24" />
                            </div>
                            <Calendar className="h-8 w-8 mb-4 opacity-90" />
                            <h3 className="font-bold text-lg">Vardiya Robotu</h3>
                            <p className="text-indigo-100 text-sm mt-1 font-medium z-10 relative">Gelecek haftanın programını<br />otomatik oluştur.</p>
                        </button>

                        <button
                            onClick={runAutoAssign}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200 transition text-left group relative overflow-hidden border border-emerald-500"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Briefcase className="h-24 w-24" />
                            </div>
                            <Briefcase className="h-8 w-8 mb-4 opacity-90" />
                            <h3 className="font-bold text-lg">Görev Dağıtıcı</h3>
                            <p className="text-emerald-100 text-sm mt-1 font-medium z-10 relative">Bekleyen işleri uygun<br />personellere ata & bildir.</p>
                        </button>

                        <button
                            onClick={runOptimizer}
                            className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-6 rounded-3xl shadow-lg shadow-amber-200 transition text-left group sm:col-span-2 relative overflow-hidden border border-amber-400"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Sparkles className="h-32 w-32" />
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="h-8 w-8 opacity-90" />
                                <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-sm">EXPERIMENTAL</span>
                            </div>
                            <h3 className="font-bold text-xl">Şirket Verimlilik Analizi</h3>
                            <p className="text-amber-100 text-sm mt-1 font-medium max-w-md">Bütün şirket verilerini analiz et, darboğazları tespit et ve iyileştirme önerileri sun.</p>
                        </button>
                    </div>

                    <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl font-mono text-sm h-[400px] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-4 text-slate-500 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-indigo-400" />
                                <span className="font-bold text-indigo-100">AI System Logs</span>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-2">
                            {logs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                                    <Terminal className="h-8 w-8 opacity-20" />
                                    <span>Henüz işlem kaydı yok...</span>
                                </div>
                            )}
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors group">
                                    <span className="text-slate-600 shrink-0 text-xs font-bold pt-0.5">[{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                    <div className="flex flex-col">
                                        <span className={
                                            log.level === 'ERROR' ? 'text-red-400 font-bold' :
                                                log.level === 'WARN' ? 'text-amber-400 font-bold' :
                                                    log.level === 'AI_ACTION' ? 'text-cyan-400 font-bold' : 'text-slate-300'
                                        }>
                                            {log.level === 'AI_ACTION' && '🤖 '}
                                            {log.level === 'ERROR' && '❌ '}
                                            {log.level === 'WARN' && '⚠️ '}
                                            {log.message}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
