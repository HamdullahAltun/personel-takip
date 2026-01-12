"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, Clock, User, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { claimSwapRequest } from "@/actions/shifts/marketplace";
import { useRouter } from "next/navigation";

export default function MarketplaceClient({ openShifts, myRequests }: { openShifts: any[], myRequests: any[] }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleClaim = async (requestId: string) => {
        if (!confirm("Bu vardiyayı devralmak istediğinize emin misiniz?")) return;
        setLoading(true);
        const res = await claimSwapRequest(requestId);
        setLoading(false);
        if (res.error) {
            alert(res.error);
        } else {
            alert("Talep gönderildi! Yönetici onayı bekleniyor.");
            router.refresh();
        }
    };

    return (
        <div className="space-y-8">
            {/* Open Shifts Section */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg"><Calendar className="w-4 h-4" /></span>
                    Devralınabilir Vardiyalar
                </h2>

                {openShifts.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                        <p>Şu an devralınabilecek açık vardiya yok.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {openShifts.map((req) => (
                            <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                    <User className="w-24 h-24" />
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                            {req.requester.profilePicture ? (
                                                <img src={req.requester.profilePicture} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-slate-400">{req.requester.name.substring(0, 2)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{req.requester.name}</p>
                                            <p className="text-xs text-slate-500">{req.requester.department?.name || 'Departman Yok'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold uppercase">
                                        Devrediyor
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="font-medium">{format(new Date(req.shift.startTime), 'd MMMM yyyy, EEEE', { locale: tr })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>{format(new Date(req.shift.startTime), 'HH:mm')} - {format(new Date(req.shift.endTime), 'HH:mm')}</span>
                                    </div>
                                    {req.reason && (
                                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                            "{req.reason}"
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleClaim(req.id)}
                                    disabled={loading}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                >
                                    Devral
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* My Requests Section */}
            {myRequests.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><User className="w-4 h-4" /></span>
                        Taleplerim
                    </h2>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                            {myRequests.map((req) => (
                                <div key={req.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {format(new Date(req.shift.startTime), 'd MMM HH:mm', { locale: tr })}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {req.status === 'OPEN' ? 'Talep açıldı, bekliyor.' :
                                                req.status === 'PENDING_APPROVAL' ? `${req.claimant?.name || 'Biri'} talip oldu, onay bekleniyor.` :
                                                    req.status === 'APPROVED' ? 'Onaylandı, işlem tamam.' : 'Reddedildi.'}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${req.status === 'OPEN' ? 'bg-blue-50 text-blue-600' :
                                            req.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-600' :
                                                req.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {req.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
