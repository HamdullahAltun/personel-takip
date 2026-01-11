"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getOpenMarketplaceShifts, claimSwapRequest } from "@/actions/shifts/marketplace";
import { Clock, User as UserIcon, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function MarketplaceTab() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await getOpenMarketplaceShifts();
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast.error("İlanlar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (requestId: string) => {
        if (!confirm("Bu vardiyayı devralmak istediğinize emin misiniz?")) return;

        const promise = claimSwapRequest(requestId);

        toast.promise(promise, {
            loading: 'İşlem yapılıyor...',
            success: (result) => {
                if (result.success) {
                    loadRequests();
                    return "Talep gönderildi! Yönetici onayı bekleniyor.";
                } else {
                    throw new Error(result.error);
                }
            },
            error: (err) => {
                return err.message || "Bir hata oluştu";
            }
        });
    };

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-slate-100 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <RefreshCw size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Açık Vardiya Yok</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                    Şu anda takas pazarında devralabileceğiniz herhangi bir vardiya bulunmuyor.
                </p>
                <button
                    onClick={loadRequests}
                    className="text-indigo-600 font-bold text-sm hover:underline"
                >
                    Tekrar Kontrol Et
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {requests.length} Açık İlan
                </p>
                <button onClick={loadRequests} className="text-indigo-600 hover:text-indigo-700">
                    <RefreshCw size={14} />
                </button>
            </div>

            {requests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
                                {req.requester.profilePicture ? (
                                    <img src={req.requester.profilePicture} alt={req.requester.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm">{req.requester.name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm leading-tight">{req.requester.name}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mt-0.5">{req.requester.department?.name || 'Departman'}</p>
                            </div>
                        </div>
                        <div className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                            Devrediyor
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 group hover:border-indigo-100 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">
                                <Clock size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-800">
                                {format(new Date(req.shift.startTime), 'd MMMM EEEE', { locale: tr })}
                            </span>
                        </div>
                        <div className="pl-9 flex items-center justify-between">
                            <p className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm inline-block">
                                {format(new Date(req.shift.startTime), 'HH:mm')} - {format(new Date(req.shift.endTime), 'HH:mm')}
                            </p>
                            <span className="text-xs font-bold text-slate-400">
                                {((new Date(req.shift.endTime).getTime() - new Date(req.shift.startTime).getTime()) / (1000 * 60 * 60)).toFixed(1)} Saat
                            </span>
                        </div>

                        {req.reason && (
                            <div className="mt-3 pl-9 border-l-2 border-slate-200 ml-3">
                                <p className="text-xs text-slate-600 italic">
                                    "{req.reason}"
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleClaim(req.id)}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={18} className="text-emerald-400" />
                        Vardiyayı Hemen Devral
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                        *Onaylandıktan sonra takvimine işlenir
                    </p>
                </div>
            ))}
        </div>
    );
}
