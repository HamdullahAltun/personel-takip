"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, RefreshCw } from "lucide-react";

interface PendingRequestsWidgetProps {
    requests: any[]; // Using any for simplicity, ideally should be typed
    currentUserId?: string; // We might need this to distinguish if user is requester or claimant
}

export default function PendingRequestsWidget({ requests }: PendingRequestsWidgetProps) {
    if (!requests || requests.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 text-sm">Bekleyen Talepler</h3>
                    <p className="text-xs text-slate-500 font-medium">Onay bekleyen takas işlemleri</p>
                </div>
            </div>

            <div className="space-y-3">
                {requests.map((req) => (
                    <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${req.status === 'PENDING_APPROVAL'
                                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}>
                                    YÖNETİCİ ONAYI
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-900">
                                    {format(new Date(req.shift.startTime), 'd MMM', { locale: tr })}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {format(new Date(req.shift.startTime), 'HH:mm')} - {format(new Date(req.shift.endTime), 'HH:mm')}
                                </span>
                            </div>
                            {req.requester.name && req.claimant.name && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    {req.requester.name} <span className="text-slate-300">→</span> {req.claimant.name}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
