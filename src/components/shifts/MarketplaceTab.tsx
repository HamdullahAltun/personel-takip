"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getOpenMarketplaceShifts, claimSwapRequest, getBiddingShifts } from "@/actions/shifts/marketplace";
import { Clock, User as UserIcon, CheckCircle, AlertCircle, RefreshCw, Star } from "lucide-react";
import { toast } from "sonner";

export default function MarketplaceTab() {
    const [requests, setRequests] = useState<any[]>([]);
    const [biddingShifts, setBiddingShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const [swaps, bids] = await Promise.all([
                getOpenMarketplaceShifts(),
                getBiddingShifts()
            ]);
            setRequests(swaps);
            setBiddingShifts(bids);
        } catch (error) {
            console.error("Failed to load marketplace", error);
            toast.error("İlanlar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (requestId: string) => {
        if (!confirm("Bu vardiyayı devralmak istediğinize emin misiniz?")) return;

        const res = await claimSwapRequest(requestId);
        if (res.success) {
            toast.success(res.message || "Talep işlendi.");
            loadRequests();
        } else {
            toast.error(res.error);
        }
    };

    const handleBid = async (shiftId: string) => {
        if (!confirm("Bu ihaleli vardiyayı devralmak üzeresiniz. Emin misiniz?")) return;

        const res = await fetch('/api/staff/shifts/bid', {
            method: 'POST',
            body: JSON.stringify({ shiftId }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            toast.success(data.message);
            loadRequests();
        } else {
            toast.error(data.error);
        }
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

    if (requests.length === 0 && biddingShifts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <RefreshCw size={24} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">Açık Vardiya Yok</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
                    Şu anda takas pazarında veya ihalede herhangi bir vardiya bulunmuyor.
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
        <div className="space-y-6 pb-20 p-2">
            <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {requests.length + biddingShifts.length} Aktif İlan / İhale
                </p>
                <button onClick={loadRequests} className="text-indigo-600 hover:text-indigo-700">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Bidding (Promotion) Section */}
            {biddingShifts.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-2 flex items-center gap-2">
                        <Star size={12} fill="currentColor" /> Acil / İhaleli Vardiyalar
                    </h4>
                    {biddingShifts.map((shift) => (
                        <div key={shift.id} className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <div className="bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                                    +{shift.bonusPoints} PUAN
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-rose-500 text-white rounded-xl">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-rose-900 text-sm">{format(new Date(shift.startTime), 'd MMMM EEEE', { locale: tr })}</p>
                                    <p className="text-xs font-bold text-rose-600">{format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleBid(shift.id)}
                                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-rose-200 active:scale-[0.98]"
                            >
                                Vardiyayı Kap (+{shift.bonusPoints} Puan)
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Swap Section */}
            {requests.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Vardiya Takasları</h4>
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white">
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
                                    Takas
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-800">
                                        {format(new Date(req.shift.startTime), 'd MMMM EEEE', { locale: tr })}
                                    </span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 pl-6">
                                    {format(new Date(req.shift.startTime), 'HH:mm')} - {format(new Date(req.shift.endTime), 'HH:mm')}
                                </p>
                            </div>

                            <button
                                onClick={() => handleClaim(req.id)}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-200"
                            >
                                Vardiyayı Al
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
