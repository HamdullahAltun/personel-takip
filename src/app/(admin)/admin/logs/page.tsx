"use client";

import { useState, useEffect, useCallback } from "react";
import { 
    ShieldAlert, 
    AlertTriangle, 
    Info, 
    Bot, 
    Activity, 
    Search, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    X,
    Eye,
    Clock
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface SystemLog {
    id: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'AI_ACTION';
    message: string;
    metadata: Record<string, unknown>;
    createdAt: string;
}

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const fetchLogs = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.append('level', filter);
            if (search) params.append('search', search);
            params.append('page', pagination.page.toString());
            params.append('limit', '20');

            const res = await fetch(`/api/admin/logs?${params.toString()}`);
            if (res.ok) {
                const result = await res.json();
                setLogs(result.logs || []);
                setPagination(prev => ({ ...prev, totalPages: result.pagination.pages }));
            }
        } finally {
            setLoading(false);
        }
    }, [filter, search, pagination.page]);

    const runAiAnalysis = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/admin/ai/logs/analyze', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setAiInsight(data.insight);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 10000); // 10 seconds
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <ShieldAlert className="text-rose-600 h-4 w-4" />;
            case 'WARN': return <AlertTriangle className="text-amber-500 h-4 w-4" />;
            case 'AI_ACTION': return <Bot className="text-purple-600 h-4 w-4" />;
            default: return <Info className="text-sky-500 h-4 w-4" />;
        }
    };

    const getBg = (level: string) => {
        switch (level) {
            case 'ERROR': return "bg-rose-50 border-rose-100/50 text-rose-700";
            case 'WARN': return "bg-amber-50 border-amber-100/50 text-amber-700";
            case 'AI_ACTION': return "bg-purple-50 border-purple-100/50 text-purple-700";
            default: return "bg-sky-50 border-sky-100/50 text-sky-700";
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
            {/* Header section with glassmorphism flair */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        Sistem Kayıtları
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Güvenlik, işlem geçmişi ve AI robotlarının hareketlerini izleyin.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-[2rem] border border-slate-200/60 shadow-sm">
                    <button 
                        onClick={runAiAnalysis}
                        disabled={analyzing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 disabled:opacity-50`}
                    >
                        {analyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        {analyzing ? "AI Analiz Ediyor..." : "AI Özet Çıkar"}
                    </button>

                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                    <button 
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${autoRefresh ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? "Canlı İzleme Açık" : "Otomatik Yenile"}
                    </button>
                    
                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                    
                    {['ALL', 'INFO', 'WARN', 'ERROR', 'AI_ACTION'].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => { setFilter(lvl); setPagination(p => ({ ...p, page: 1 })); }}
                            className={`px-4 py-2 rounded-2xl text-[11px] uppercase tracking-widest font-black transition-all ${filter === lvl ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-white'}`}
                        >
                            {lvl === 'ALL' ? 'Tümü' : lvl}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex items-center gap-4 focus-within:ring-2 ring-indigo-500/20 transition-all">
                    <Search className="h-5 w-5 text-slate-400" />
                    <input
                        placeholder="Log mesajlarında ara (örn: 'Hata', 'Kullanıcı', 'AI')..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                        className="flex-1 outline-none text-[15px] font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm font-bold text-slate-600">Bugünkü Kayıtlar</span>
                    </div>
                    <span className="text-lg font-black text-indigo-600">{logs.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                    </div>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Seviye</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">İşlem Detayı</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Tarih</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Eylem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 grayscale opacity-40">
                                            <Activity className="h-12 w-12 text-slate-300" />
                                            <p className="text-slate-500 font-bold">Herhangi bir kayıt bulunamadı.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.map(log => (
                                <motion.tr 
                                    layout
                                    key={log.id} 
                                    className="group hover:bg-slate-50/80 transition-all cursor-default"
                                >
                                    <td className="px-8 py-4 w-40">
                                        <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border font-black text-[10px] tracking-wide w-fit ${getBg(log.level)}`}>
                                            {getIcon(log.level)}
                                            {log.level}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 max-w-2xl">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-slate-700 text-[14px] leading-tight group-hover:text-indigo-900 transition-colors">
                                                {log.message}
                                            </span>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">Metadata Mevcut</span>
                                                    <span className="truncate max-w-sm italic">
                                                        {JSON.stringify(log.metadata).substring(0, 100)}...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-600">{format(new Date(log.createdAt), 'd MMMM yyyy', { locale: tr })}</span>
                                            <span className="text-[11px] font-medium text-slate-400">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button 
                        disabled={pagination.page === 1}
                        onClick={() => { setPagination(p => ({ ...p, page: p.page - 1 })); setLoading(true); }}
                        className="p-3 bg-white border border-slate-200 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-[1.5rem] border border-slate-200">
                        <span className="text-sm font-black text-indigo-600">{pagination.page}</span>
                        <span className="text-xs font-bold text-slate-400">/</span>
                        <span className="text-sm font-black text-slate-600">{pagination.totalPages}</span>
                    </div>
                    <button 
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => { setPagination(p => ({ ...p, page: p.page + 1 })); setLoading(true); }}
                        className="p-3 bg-white border border-slate-200 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Modal Detail Overlay */}
            <AnimatePresence>
                {selectedLog && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl border ${getBg(selectedLog.level)}`}>
                                        {getIcon(selectedLog.level)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg leading-tight">İşlem Detayı</h3>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                            Log ID: {selectedLog.id}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="p-3 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-2xl border border-slate-200 transition-all text-slate-400"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mesaj</span>
                                    <p className="text-lg font-bold text-slate-800 leading-relaxed bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                                        {selectedLog.message}
                                    </p>
                                </div>
                                
                                {selectedLog.metadata && (
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Metadata (Teknik Veri)</span>
                                        <pre className="text-xs font-mono bg-slate-900 text-slate-300 p-6 rounded-[1.5rem] overflow-auto max-h-[300px] border border-slate-800 shadow-inner">
                                            {JSON.stringify(selectedLog.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarih</span>
                                        <span className="text-sm font-bold text-slate-700">{format(new Date(selectedLog.createdAt), 'd MMMM yyyy HH:mm:ss', { locale: tr })}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seviye</span>
                                        <span className={`text-sm font-black ${selectedLog.level === 'ERROR' ? 'text-rose-600' : 'text-indigo-600'}`}>{selectedLog.level}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={() => setSelectedLog(null)}
                                    className="px-8 py-3 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                                >
                                    Kapat
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* AI Insight Overlay */}
            <AnimatePresence>
                {aiInsight && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAiInsight(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[120]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: "100%" }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: "100%" }}
                            className="fixed right-6 top-6 bottom-6 w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl z-[121] flex flex-col border border-slate-100"
                        >
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-purple-50 to-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm">
                                        <Bot className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-lg">AI Log Analizi</h3>
                                </div>
                                <button 
                                    onClick={() => setAiInsight(null)}
                                    className="p-2 hover:bg-white rounded-xl transition-all"
                                >
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60 text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                                    {aiInsight}
                                </div>
                                
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                                        <Info className="h-4 w-4" />
                                        Analiz Hakkında
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Bu özet, son 100 sistem kaydı yapay zeka tarafından taranarak oluşturulmuştur. 
                                        Kritik hatalar ve robot performansları önceliklendirilmiştir.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-white border-t border-slate-100">
                                <button 
                                    onClick={() => setAiInsight(null)}
                                    className="w-full py-4 bg-slate-900 text-white font-black text-sm rounded-2xl hover:bg-slate-800 transition-all"
                                >
                                    Anladım
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
