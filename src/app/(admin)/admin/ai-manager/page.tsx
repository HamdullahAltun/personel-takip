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
        if (!confirm("Yapay zeka otomatik vardiya planlaması yapacak. Onaylıyor musunuz?")) return;
        const res = await fetch('/api/admin/ai/actions/schedule', { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        fetchLogs();
    };

    const runAutoAssign = async () => {
        if (!confirm("Bekleyen görevler uygun personellere dağıtılacak. Onaylıyor musunuz?")) return;
        const res = await fetch('/api/admin/ai/actions/assign-tasks', { method: 'POST' });
        const result = await res.json();
        alert(result.message);
        fetchLogs();
    }

    const runOptimizer = async () => {
        const btn = document.activeElement as HTMLButtonElement;
        const originalText = btn.innerText;
        btn.innerText = "Analiz Ediliyor...";
        const res = await fetch('/api/admin/ai/actions/optimize', { method: 'POST' });
        const result = await res.json();
        alert(`Analiz Tamamlandı. ${result.insights || 0} öneri bulundu.`);
        fetchLogs();
        btn.innerText = originalText;
    }

    if (loading) return <div className="p-8 text-center text-slate-400">Yükleniyor...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-400/30">
                                <Brain className="h-8 w-8 text-indigo-300" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">AI Şirket Beyni</h1>
                        </div>
                        <p className="text-indigo-200/60 font-medium max-w-xl">
                            Şirket operasyonlarını otomatize eden merkezi yapay zeka yönetim paneli.
                        </p>
                    </div>
                    <div className="hidden lg:block text-right">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Sistem Aktif
                        </span>
                    </div>
                </div>
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SETTINGS CARD */}
                <div className="lg:col-span-1 space-y-6">
                    <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <Settings className="h-5 w-5 text-slate-400" />
                            Otomasyon Ayarları
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-700 text-sm">Otomatik Vardiya</label>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-indigo"
                                        checked={config.autoScheduleEnabled || false}
                                        onChange={e => setConfig({ ...config, autoScheduleEnabled: e.target.checked })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="block text-slate-400 mb-1">Başlangıç</span>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                                            value={config.operatingHoursStart || ""}
                                            onChange={e => setConfig({ ...config, operatingHoursStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-slate-400 mb-1">Bitiş</span>
                                        <input
                                            type="time"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                                            value={config.operatingHoursEnd || ""}
                                            onChange={e => setConfig({ ...config, operatingHoursEnd: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">Minimum Personel (Vardiya Başı)</span>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-sm"
                                        value={config.minStaffPerShift || 0}
                                        onChange={e => setConfig({ ...config, minStaffPerShift: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-slate-100" />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="font-bold text-slate-700 text-sm">Görev Dağıtımı</label>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-indigo"
                                        checked={config.autoTaskAssignment || false}
                                        onChange={e => setConfig({ ...config, autoTaskAssignment: e.target.checked })}
                                    />
                                </div>
                                <div>
                                    <span className="block text-slate-400 text-xs mb-1">Dağıtım Modu</span>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-sm"
                                        value={config.taskAssignmentMode || "BALANCED"}
                                        onChange={e => setConfig({ ...config, taskAssignmentMode: e.target.value })}
                                    >
                                        <option value="BALANCED">Dengeli Dağıtım</option>
                                        <option value="SKILL">Yetenek Odaklı</option>
                                        <option value="SPEED">Hız Odaklı</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                                Ayarları Kaydet
                            </button>
                        </div>
                    </form>
                </div>

                {/* ACTIONS & LOGS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={runAutoSchedule}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 transition text-left group"
                        >
                            <Calendar className="h-8 w-8 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg">Vardiya Robotunu Çalıştır</h3>
                            <p className="text-indigo-200 text-sm mt-1">Gelecek haftanın programını otomatik oluştur.</p>
                        </button>

                        <button
                            onClick={runAutoAssign}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200 transition text-left group"
                        >
                            <Briefcase className="h-8 w-8 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg">Görevleri Dağıt</h3>
                            <p className="text-emerald-200 text-sm mt-1">Bekleyen işleri uygun personellere ata.</p>
                        </button>

                        <button
                            onClick={runOptimizer}
                            className="bg-amber-600 hover:bg-amber-700 text-white p-6 rounded-2xl shadow-lg shadow-amber-200 transition text-left group sm:col-span-2 lg:col-span-2"
                        >
                            <Sparkles className="h-8 w-8 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-lg">Verimlilik Analizi Yap</h3>
                            <p className="text-amber-200 text-sm mt-1">Sistem verilerini tara ve iyileştirme önerileri sun.</p>
                        </button>
                    </div>

                    <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-4 text-slate-500 border-b border-slate-800 pb-2">
                            <Terminal className="h-4 w-4" />
                            <span>System Logs</span>
                        </div>
                        <div className="space-y-2">
                            {logs.length === 0 && <span className="opacity-50">Log kaydı yok...</span>}
                            {logs.map((log) => (
                                <div key={log.id} className="flex gap-3">
                                    <span className="text-slate-600 shrink-0">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                                    <span className={
                                        log.level === 'ERROR' ? 'text-red-400' :
                                            log.level === 'WARN' ? 'text-amber-400' :
                                                log.level === 'AI_ACTION' ? 'text-cyan-400' : 'text-slate-300'
                                    }>
                                        {log.level === 'AI_ACTION' && '🤖 '}
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
