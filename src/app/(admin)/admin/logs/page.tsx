"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, Info, Bot, Activity, Search } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/admin/logs');
            if (res.ok) setLogs(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (level: string) => {
        switch (level) {
            case 'ERROR': return <ShieldAlert className="text-red-600" />;
            case 'WARN': return <AlertTriangle className="text-amber-500" />;
            case 'AI_ACTION': return <Bot className="text-purple-600" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    const getBg = (level: string) => {
        switch (level) {
            case 'ERROR': return "bg-red-50 border-red-100";
            case 'WARN': return "bg-amber-50 border-amber-100";
            case 'AI_ACTION': return "bg-purple-50 border-purple-100";
            default: return "bg-blue-50 border-blue-100";
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter !== "ALL" && log.level !== filter) return false;
        if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-indigo-600" />
                        Sistem Kayıtları (Audit Logs)
                    </h1>
                    <p className="text-slate-500">Güvenlik ve işlem geçmişi izleme.</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {['ALL', 'INFO', 'WARN', 'ERROR', 'AI_ACTION'].map(lvl => (
                        <button
                            key={lvl}
                            onClick={() => setFilter(lvl)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === lvl ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {lvl === 'ALL' ? 'Tümü' : lvl}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    placeholder="Loglarda ara..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 outline-none text-sm font-medium text-slate-700"
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-4">Seviye</th>
                            <th className="p-4">Mesaj</th>
                            <th className="p-4">Tarih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">Kayıt bulunamadı.</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 w-32">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border w-fit font-bold text-xs ${getBg(log.level)}`}>
                                        {getIcon(log.level)}
                                        {log.level}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-slate-700">
                                    {log.message}
                                    {log.metadata && (
                                        <div className="mt-1 text-xs font-mono text-slate-400 truncate max-w-md">
                                            {JSON.stringify(log.metadata)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-slate-500 w-48 font-medium">
                                    {format(new Date(log.createdAt), 'd MMM yyyy HH:mm', { locale: tr })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
